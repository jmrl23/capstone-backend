import { vendors } from '@jmrl23/express-helper';

export class UserLoginDto {
  @vendors.classValidator.IsString()
  @vendors.classValidator.IsNotEmpty()
  @vendors.classTransformer.Transform(({ value }: { value: string }) =>
    value.toLowerCase(),
  )
  username: string;

  @vendors.classValidator.IsString()
  @vendors.classValidator.IsNotEmpty()
  password: string;
}
