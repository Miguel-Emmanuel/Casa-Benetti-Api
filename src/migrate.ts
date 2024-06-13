import {BaseApiLb4Application} from './application';

export async function migrate(args: string[]) {

  const existingSchema = args.includes('--rebuild') ? 'drop' : 'alter';
  console.log('Migrating schemas (%s existing schema)', existingSchema);

  const app = new BaseApiLb4Application();
  await app.boot();
  await app.migrateSchema({
    existingSchema,
    // !!!! IMPORTANT !!!!
    // The order of table creation is important.
    // A referenced table must exist before creating a
    // foreign key constraint.
    // For PostgreSQL connector, it does not create tables in the
    // right order.  Therefore, this change is needed.
    models: [
      'Organization',
      'Role',
      'UserData',
      'User',
      'UserCredentials',
      'Module',
      'RoleModule',
      'Document',
      'Group',
      'Customer',
      'Quotation',
      'QuotationProjectManager',
      'QuotationDesigner',
      'Branch',
      'Warehouse',
      'Provider',
      'Product',
      'QuotationProducts',
      'QuotationProjectManager',
      'Brand',
      'ProviderBrand'
    ],
  });

  // Connectors usually keep a pool of opened connections,
  // this keeps the process running even after all work is done.
  // We need to exit explicitly.
  process.exit(0);
}

migrate(process.argv).catch(err => {
  console.error('Cannot migrate database schema', err);
  process.exit(1);
});
