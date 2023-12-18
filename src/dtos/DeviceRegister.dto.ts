import { vendors } from '@jmrl23/express-helper';

export class DeviceRegisterDto {
  @vendors.classValidator.IsString()
  @vendors.classValidator.MinLength(5)
  device_key: string;
}
