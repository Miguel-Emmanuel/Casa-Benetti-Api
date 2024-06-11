import {Model, model, property} from '@loopback/repository';

@model()
export class Address extends Model {
  @property({
    type: 'string'
  })
  street?: string;

  @property({
    type: 'string'
  })
  extNum?: string;

  @property({
    type: 'string'
  })
  intNum?: string;

  @property({
    type: 'string'
  })
  zipCode?: string;

  @property({
    type: 'string'
  })
  suburb?: string;

  @property({
    type: 'string'
  })
  city?: string;

  @property({
    type: 'string'
  })
  state?: string;

  @property({
    type: 'string'
  })
  country?: string;

}
