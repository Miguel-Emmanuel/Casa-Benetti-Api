import {organizationSeeds} from '.';

export const roleSeeds = [
  {
    name: 'Adminstrador',
    description: 'Rol Administrador',
    organization: organizationSeeds[0].name,
    accessLevel: 0,
  }
];
