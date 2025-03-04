// Cambia la inyección para usar StorageBindings
import {Storage} from '@google-cloud/storage';
import {inject, Provider} from '@loopback/core';
import {StorageBindings} from '../keys'; // <-- Nueva importación

export class GcpStorageProvider implements Provider<Storage> {
  constructor(
    @inject(StorageBindings.GCP_CONFIG) // <-- Usa la constante aquí
    private config: {
      projectId: string;
      keyFilename: string;
    },
  ) { }

  value() {
    return new Storage(this.config);
  }
}
