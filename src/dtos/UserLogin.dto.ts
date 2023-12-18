import { vendors } from '@jmrl23/express-helper';

export class UserLoginDto {
  @vendors.classValidator.IsString()
  @vendors.classValidator.IsNotEmpty()
  username: string;

  @vendors.classValidator.IsString()
  @vendors.classValidator.IsNotEmpty()
  password: string;
}
