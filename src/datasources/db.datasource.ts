import {inject} from '@loopback/core';
import {juggler} from '@loopback/repository';

import config from './db.datasource.config.json';
import 'dotenv/config'

const dbConfig =
  process.env.DB_CONFIG === 'production'
    ? {
      name: process.env.DB_NAME,
      connector: process.env.DB_CONNECTOR,
      url: process.env.DB_URL,
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE,
    }
    : config;

export class DbDataSource extends juggler.DataSource {
  public static dataSourceName = 'db';

  constructor(
    @inject('datasources.config.postgre', {optional: true})
    dsConfig: object = dbConfig
  ) {
    super(dsConfig);
  }
}


