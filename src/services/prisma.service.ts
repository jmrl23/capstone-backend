import { PrismaClient } from '@prisma/client';

export class PrismaService {
  private static instance: PrismaService;

  private constructor(private readonly prismaClient: PrismaClient) {}

  public static async getInstance(): Promise<PrismaService> {
    if (!PrismaService.instance) {
      const prismaClient = new PrismaClient();
      const instance = new PrismaService(prismaClient);

      PrismaService.instance = instance;
    }

    return PrismaService.instance;
  }

  public getPrismaClient(): PrismaClient {
    return this.prismaClient;
  }
}
