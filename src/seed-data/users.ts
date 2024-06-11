import {organizationSeeds, roleSeeds} from '.';

export const userSeeds = [
  {
    user: {
      firstName: 'SUPER',
      lastName: 'ADMIN',
      username: 'pruebas@whathecode.com',
      email: 'pruebas@whathecode.com',
      password: 'Guao2023.-**',
      organization: organizationSeeds[0].name,
      isFirstTimeLogin: false,
      isActive: true,
      isSuperAdmin: true
    },
    userData: {
      role: roleSeeds[0].name,
    },
  }
];
