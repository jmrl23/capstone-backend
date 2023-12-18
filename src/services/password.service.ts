import bcrypt from 'bcrypt';

export class PasswordService {
  private static SALT_ROUNDS = 3;

  public static async hash(plain: string): Promise<string> {
    const salt = await bcrypt.genSalt(PasswordService.SALT_ROUNDS);
    const result = await bcrypt.hash(plain, salt);

    return result;
  }

  public static async compare(plain: string, hashed: string): Promise<boolean> {
    const result = await bcrypt.compare(plain, hashed);

    return result;
  }
}
