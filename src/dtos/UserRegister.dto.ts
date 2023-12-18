import { vendors } from '@jmrl23/express-helper';

export class UserRegisterDto {
  @vendors.classValidator.IsString()
  @vendors.classValidator.IsNotEmpty()
  @vendors.classValidator.Matches('^[a-z0-9_]{4,}[0-9]*$', void 0, {
    message: 'Invalid username',
  })
  username: string;

  @vendors.classValidator.IsString()
  @vendors.classValidator.IsNotEmpty()
  @vendors.classValidator.IsStrongPassword({
    minLength: 5,
    minLowercase: 0,
    minUppercase: 0,
    minNumbers: 0,
    minSymbols: 0,
  })
  password: string;

  @vendors.classValidator.IsOptional()
  @vendors.classValidator.IsUrl()
  image_url?: string;

  @vendors.classValidator.IsOptional()
  @vendors.classValidator.IsString()
  @vendors.classValidator.MinLength(1)
  display_name?: string;
}
