import {authenticate} from '@loopback/authentication';
import {inject} from '@loopback/core';
import {
  get
} from '@loopback/rest';
import estadosMunicipios from '../datasources/estadosMunicipios.json';

import {ResponseServiceBindings} from '../keys';
import {ResponseService} from '../services';


export class LocationController {
  constructor(
    @inject(ResponseServiceBindings.RESPONSE_SERVICE)
    public responseService: ResponseService,
  ) { }

  @authenticate.skip()
  @get('/locations/states', {
    responses: {
      '200': {
        description: 'Array of States',
        content: {
          'application/json': {
            schema: {type: 'array'},
          },
        },
      },
    },
  })
  async findLocations(
  ): Promise<any> {
    return estadosMunicipios
  }
}
