import {organizationSeeds} from '.';
import {AccessLevelRolE} from '../enums';

export const roleSeeds = [
  {
    name: 'Adminstrador',
    description: 'Rol Administrador',
    organization: organizationSeeds[0].name,
    accessLevel: AccessLevelRolE.GLOBAL,
  }
];
