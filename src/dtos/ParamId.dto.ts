import { vendors } from '@jmrl23/express-helper';

export class ParamIdDto {
  @vendors.classValidator.IsUUID('4')
  id: string;
}
