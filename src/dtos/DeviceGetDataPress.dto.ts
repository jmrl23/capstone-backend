import { vendors } from '@jmrl23/express-helper';

export class DeviceGetDataPressDto {
  @vendors.classValidator.IsUUID('4')
  device_id: string;

  @vendors.classValidator.IsOptional()
  @vendors.classValidator.IsDateString()
  created_at_from?: string;

  @vendors.classValidator.IsOptional()
  @vendors.classValidator.IsDateString()
  created_at_to?: string;
}
