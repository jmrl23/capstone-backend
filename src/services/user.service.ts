import type { PrismaClient } from '@prisma/client';
import { CacheService } from './cache.service';
import { PrismaService } from './prisma.service';
import { caching } from 'cache-manager';
import { vendors } from '@jmrl23/express-helper';
import { default as ms } from 'ms';
import { PasswordService } from './password.service';

export class UserService {
  private static instance: UserService;

  private constructor(
    private readonly prismaClient: PrismaClient,
    private readonly cacheService: CacheService,
  ) {}

  public static async createInstance(): Promise<UserService> {
    const prismaService = await PrismaService.getInstance();
    const instance = new UserService(
      prismaService.getPrismaClient(),
      await CacheService.createInstance(
        caching('memory', {
          ttl: ms('1m'),
        }),
      ),
    );

    return instance;
  }

  public static async getInstance(): Promise<UserService> {
    if (!UserService.instance) {
      UserService.instance = await UserService.createInstance();
    }

    return UserService.instance;
  }

  public async getUserById(
    id: string,
    resetCache: boolean = false,
  ): Promise<Express.User | null> {
    const cacheKey = `user:id:${id}`;

    if (resetCache) await this.cacheService.del(cacheKey);

    const cache = await this.cacheService.get<GUser>(cacheKey);

    if (cache) return cache;

    const user = await this.prismaClient.user.findUnique({
      where: {
        id,
      },
      include: {
        UserAuth: {
          select: {
            username: true,
          },
        },
        UserInformation: {
          select: {
            imageUrl: true,
            displayName: true,
          },
        },
      },
    });

    await this.cacheService.set(cacheKey, user);

    return user;
  }

  public async register(
    username: string,
    password: string,
    imageUrl?: string,
    displayName?: string,
  ): Promise<Express.User> {
    const conflict = await this.prismaClient.userAuth.findUnique({
      where: {
        username: username.toLowerCase(),
      },
    });

    if (conflict) {
      throw new vendors.httpErrors.Conflict('Username already taken');
    }

    const user = await this.prismaClient.user.create({
      data: {
        UserAuth: {
          create: {
            username: username.toLowerCase(),
            password: await PasswordService.hash(password),
          },
        },
        UserInformation: {
          create: {
            imageUrl,
            displayName,
          },
        },
      },
      include: {
        UserAuth: {
          select: {
            username: true,
          },
        },
        UserInformation: {
          select: {
            imageUrl: true,
            displayName: true,
          },
        },
      },
    });

    return user;
  }

  public async login(
    username: string,
    password: string,
  ): Promise<Express.User> {
    const userAuth = await this.prismaClient.userAuth.findUnique({
      where: {
        username: username.toLowerCase(),
      },
      include: {
        User: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!userAuth) {
      throw new vendors.httpErrors.Unauthorized('User not exist');
    }

    if (!(await PasswordService.compare(password, userAuth.password))) {
      throw new vendors.httpErrors.Unauthorized('Password incorrect');
    }

    const user = await this.getUserById(userAuth.User[0].id);

    return user!;
  }

  public async update(
    id: string,
    oldPassword?: string,
    password?: string,
    imageUrl?: string,
    displayName?: string,
  ): Promise<Express.User> {
    let _password;

    if (oldPassword && password) {
      const user = await this.prismaClient.user.findUnique({
        where: {
          id,
        },
        select: {
          UserAuth: {
            select: {
              username: true,
              password: true,
            },
          },
        },
      });

      if (!user) throw new vendors.httpErrors.NotFound('User not found');

      if (await PasswordService.compare(oldPassword, user.UserAuth.password)) {
        _password = await PasswordService.hash(password);
      }
    }

    if ((oldPassword && !password) || (!oldPassword && password)) {
      throw new vendors.httpErrors.BadRequest(
        'Password and old password should both have a value',
      );
    }

    await this.prismaClient.user.update({
      where: {
        id,
      },
      data: {
        UserAuth: {
          update: {
            password: _password,
          },
        },
        UserInformation: {
          update: {
            imageUrl,
            displayName,
          },
        },
      },
    });

    const user = await this.getUserById(id, true);

    return user!;
  }
}
