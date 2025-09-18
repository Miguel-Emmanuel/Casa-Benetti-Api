// Cambia la inyección para usar StorageBindings
import {Storage} from '@google-cloud/storage';
import {inject, Provider} from '@loopback/core';
import {StorageBindings} from '../keys'; // <-- Nueva importación

export class GcpStorageProvider implements Provider<Storage> {
  constructor(
    @inject(StorageBindings.GCP_CONFIG)
    private config: {
      projectId: string;
      // keyFilename?: string; // Ya no es necesario
    },
  ) {}

  value() {
    // Usar la variable de entorno GOOGLE_APPLICATION_CREDENTIALS
    return new Storage({ projectId: this.config.projectId });
    // Si la variable está definida, la librería la usará automáticamente
  }
}
