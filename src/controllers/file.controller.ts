// src/controllers/storage.controller.ts
import {Storage} from '@google-cloud/storage';
import {authenticate} from '@loopback/authentication';
import {inject} from '@loopback/core';
import {
  del,
  get,
  HttpErrors,
  param,
  post,
  Request,
  requestBody,
  Response,
  RestBindings,
} from '@loopback/rest';
import dotenv from 'dotenv';
import fs from 'fs';
import multer from 'multer';
import path from 'path';
import {promisify} from 'util';
import {FILE_UPLOAD_SERVICE, STORAGE_DIRECTORY, StorageBindings} from '../keys';
import {FileUploadHandler} from '../types';

const readdir = promisify(fs.readdir);

dotenv.config();

// @authenticate('jwt')
export class StorageController {
  constructor(
    @inject(StorageBindings.GCP_CONFIG)
    private storage: Storage,
    @inject(StorageBindings.GCP_BUCKET_NAME)
    private bucketName: string,
    @inject(FILE_UPLOAD_SERVICE)
    private handler: FileUploadHandler,
    @inject(STORAGE_DIRECTORY)
    private storageDirectory: string
  ) { }

  // SUBIR ARCHIVO
  @post('/files', {
    responses: {
      200: {
        content: {'application/json': {schema: {type: 'object'}}},
        description: 'Archivo subido correctamente',
      },
    },
  })
  async uploadFile(
    @requestBody.file() request: Request,
    @inject(RestBindings.Http.RESPONSE) response: Response,
  ): Promise<any> {
    return process.env.NODE_ENV === 'production'
      ? this.uploadFileGcp(request, response)
      : this.uploadFileLocal(request, response);
  }

  // DESCARGAR ARCHIVO
  @authenticate.skip()
  @get('/files/{filename}')
  async downloadFile(
    @param.path.string('filename') filename: string,
    @inject(RestBindings.Http.RESPONSE) response: Response,
  ) {
    return process.env.NODE_ENV === 'production'
      ? this.getFileByNameGcp(filename, response)
      : this.getFileByNameLocal(filename, response);
  }

  // GENERAR URL PARA VISUALIZAR
  @authenticate.skip()
  @get('/files/video/{filename}')
  async generateViewUrl(
    @param.path.string('filename') filename: string,
  ): Promise<{url: string}> {
    const bucket = this.storage.bucket(this.bucketName);
    const file = bucket.file(filename);

    const [exists] = await file.exists();
    if (!exists) throw new Error('Archivo no encontrado');

    // Genera URL firmada válida por 15 minutos
    const [signedUrl] = await file.getSignedUrl({
      action: 'read',
      expires: Date.now() + 15 * 60 * 1000, // 15 minutos
    });

    return {url: signedUrl};
  }

  // LISTAR ARCHIVOS (OPCIONAL)
  @get('/files')
  async listFiles(): Promise<string[]> {
    return process.env.NODE_ENV === 'production'
      ? this.getAllFilesGcp()
      : this.getAllFilesLocal();
  }

  // ELIMINAR ARCHIVO (OPCIONAL)
  @del('/delete-file/{filename}')
  async deleteFile(
    @param.path.string('filename') filename: string,
  ): Promise<any> {
    return process.env.NODE_ENV === 'production'
      ? this.deleteFileGcp(filename)
      : this.deleteFileLocal(filename);
  }

  async uploadFileGcp(request: Request, response: any) {
    try {
      const bucket = this.storage.bucket(this.bucketName);

      return new Promise((resolve, reject) => {
        // Configuramos multer con memoria como almacenamiento
        const upload = multer({
          storage: multer.memoryStorage(),
          limits: {fileSize: 5 * 1024 * 1024}, // límite de 5MB
        }).any();

        upload(request, response, async (err: any) => {
          if (err) return reject(err);

          // request.files es ahora un array de archivos
          const files = request.files as Express.Multer.File[];
          if (!files || !files.length) {
            return reject(new Error('No se recibió ningún archivo'));
          }

          try {
            // Subimos cada archivo al bucket y recopilamos resultados
            const uploadPromises = files.map(file => {
              return new Promise((res, rej) => {
                const blob = bucket.file(file.originalname);
                const blobStream = blob.createWriteStream({
                  resumable: false,
                  metadata: {contentType: file.mimetype},
                });

                blobStream.on('error', error => rej(error));
                blobStream.on('finish', () => {
                  const publicUrl = `https://storage.googleapis.com/${bucket.name}/${blob.name}`;
                  // En lugar de usar file.fieldname,
                  // asignamos el valor de originalname a fieldname.
                  res({
                    fieldname: file.originalname,
                    originalname: file.originalname,
                    encoding: file.encoding,
                    mimetype: file.mimetype,
                    size: file.size,
                    url: publicUrl,
                  });
                });

                blobStream.end(file.buffer);
              });
            });

            // Espera a que todas las subidas finalicen
            const uploadedFiles = await Promise.all(uploadPromises);

            // Devuelve la lista de archivos subidos
            resolve({files: uploadedFiles, fields: []});
          } catch (uploadError) {
            reject(uploadError);
          }
        });
      });
    } catch (error) {
      console.log("error:", error)
      return error;
    }
  }

  async uploadFileLocal(request: any, response: any) {
    return new Promise<object>((resolve, reject) => {
      this.handler(request, response, (err: any) => {
        if (err) reject(err);
        else {
          resolve(StorageController.getFilesAndFields(request));
        }
      });
    });
  }

  /**
   * Get files and fields for the request
   * @param request - Http request
   */
  private static getFilesAndFields(request: Request) {
    const uploadedFiles = request.files;
    const mapper = (f: globalThis.Express.Multer.File) => ({
      fieldname: f.fieldname,
      originalname: f.originalname,
      encoding: f.encoding,
      mimetype: f.mimetype,
      size: f.size,
    });
    let files: object[] = [];
    if (Array.isArray(uploadedFiles)) {
      files = uploadedFiles.map(mapper);
    } else {
      for (const filename in uploadedFiles) {
        files.push(...uploadedFiles[filename].map(mapper));
      }
    }
    return {files, fields: request.body};
  }

  async deleteFileLocal(filename: string) {
    try {
      fs.unlinkSync('.sandbox/' + filename);
      return JSON.stringify({message: 'File Deleted Successfully'});
    } catch (err) {
      return JSON.stringify({error: filename + ' ' + err});
    }
  }

  async deleteFileGcp(filename: string) {
    const bucket = this.storage.bucket(this.bucketName);
    await bucket.file(filename).delete();
    return {message: `Archivo ${filename} eliminado correctamente`};
  }

  async getAllFilesGcp() {
    const bucket = this.storage.bucket(this.bucketName);
    const [files] = await bucket.getFiles();
    return files?.map(file => file?.name);
  }

  async getAllFilesLocal() {
    const files = await readdir(this.storageDirectory);
    return files;
  }

  async getFileByNameGcp(filename: string, response: any) {
    const bucket = this.storage.bucket(this.bucketName);
    const file = bucket.file(filename);

    const [exists] = await file.exists();
    if (!exists) throw new Error('Archivo no encontrado');

    response.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    response.setHeader('Content-Type', (await file.getMetadata())[0].contentType as any);

    return file.createReadStream().pipe(response);
  }

  async getFileByNameLocal(filename: string, response: any) {
    const file = this.validateFileName(filename);
    response.download(file, filename);
    return response;
  }


  private validateFileName(fileName: string) {
    const resolved = path.resolve(this.storageDirectory, fileName);
    if (resolved.startsWith(this.storageDirectory)) return resolved;
    // The resolved file is outside sandbox
    throw new HttpErrors.BadRequest(`Invalid file name: ${fileName}`);
  }
}
