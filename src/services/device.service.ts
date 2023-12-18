import type { PrismaClient } from '@prisma/client';
import { CacheService } from './cache.service';
import { PrismaService } from './prisma.service';
import { caching } from 'cache-manager';
import { default as ms } from 'ms';
import { vendors } from '@jmrl23/express-helper';

export class DeviceService {
  private static instance: DeviceService;

  private constructor(
    private readonly prismaClient: PrismaClient,
    private readonly cacheService: CacheService,
  ) {}

  public static async createInstance(): Promise<DeviceService> {
    const prismaService = await PrismaService.getInstance();
    const instance = new DeviceService(
      prismaService.getPrismaClient(),
      await CacheService.createInstance(
        caching('memory', {
          ttl: ms('1m'),
        }),
      ),
    );

    return instance;
  }

  public static async getInstance(): Promise<DeviceService> {
    if (!DeviceService.instance) {
      DeviceService.instance = await DeviceService.createInstance();
    }

    return DeviceService.instance;
  }

  public async register(userId: string, deviceKey: string): Promise<GDevice> {
    const existingDevice = await this.prismaClient.device.findFirst({
      where: {
        deviceKey,
      },
    });

    if (existingDevice) {
      if (existingDevice.userId && existingDevice.userId !== userId) {
        throw vendors.httpErrors.Conflict(
          'Device already registered to a different user',
        );
      }

      if (existingDevice.userId === userId) {
        return await this.getDeviceById(existingDevice.id);
      }

      await this.prismaClient.device.update({
        where: {
          id: existingDevice.id,
        },
        data: {
          userId,
        },
      });

      return await this.getDeviceById(existingDevice.id, true);
    }

    const device = await this.prismaClient.device.create({
      data: {
        User: {
          connect: {
            id: userId,
          },
        },
        deviceKey,
        DeviceData: {
          create: {},
        },
      },
      select: {
        id: true,
      },
    });

    await this.cacheService.del(`device:list:${userId}`);

    return await this.getDeviceById(device.id);
  }

  public async unregister(id: string, userId: string): Promise<GDevice> {
    const device = await this.prismaClient.device.update({
      where: {
        id,
        userId,
      },
      data: {
        userId: null,
      },
    });

    await this.cacheService.del(`device:list:${userId}`);

    return await this.getDeviceById(device.id, true);
  }

  public async getDeviceById(
    id: string,
    resetCache: boolean = false,
  ): Promise<GDevice> {
    const cacheKey = `device:id:${id}`;

    if (resetCache) await this.cacheService.del(cacheKey);

    const cache = await this.cacheService.get<GDevice>(cacheKey);

    if (cache) return cache;

    const lastFiveMonths = new Date();

    lastFiveMonths.setMonth(lastFiveMonths.getMonth() - 5);
    lastFiveMonths.setDate(1);

    const device = await this.prismaClient.device.findUnique({
      where: {
        id,
      },
      include: {
        DeviceData: {
          select: {
            isRinging: true,
            DeviceDataPress: {
              where: {
                createdAt: {
                  gte: lastFiveMonths,
                },
              },
              select: {
                createdAt: true,
              },
            },
          },
        },
      },
    });

    if (!device) throw new vendors.httpErrors.NotFound('Device not found');

    await this.cacheService.set(cacheKey, device);

    return device;
  }

  public async getDeviceByKey(key: string): Promise<GDevice> {
    const cacheKey = `device:key:${key}`;
    const deviceId = await this.cacheService.get<string>(cacheKey);

    if (deviceId) {
      return await this.getDeviceById(deviceId);
    }

    const device = await this.prismaClient.device.findFirst({
      where: {
        deviceKey: key,
      },
      select: {
        id: true,
      },
    });

    if (device) {
      await this.cacheService.set(cacheKey, device.id);
    }

    return await this.getDeviceById(device!.id);
  }

  public async getDevicesByUserId(userId: string): Promise<GDevice[]> {
    const listCacheKey = `device:list:${userId}`;

    let list = await this.cacheService.get<{ id: string }[]>(listCacheKey);

    if (!list) {
      list = await this.prismaClient.device.findMany({
        where: {
          userId,
        },
        select: {
          id: true,
        },
      });

      await this.cacheService.set(listCacheKey, list);
    }

    const devices = await Promise.all(
      list.map((device) => this.getDeviceById(device.id)),
    );

    return devices;
  }

  public async toggleAlarmById(id: string, state: boolean): Promise<GDevice> {
    const device = await this.prismaClient.device.update({
      where: {
        id,
      },
      data: {
        DeviceData: {
          update: {
            isRinging: state,
          },
        },
      },
      select: {
        id: true,
      },
    });

    return await this.getDeviceById(device.id, true);
  }

  public async addDeviceDataPress(id: string): Promise<GDevice> {
    const device = await this.prismaClient.device.update({
      where: {
        id,
      },
      data: {
        DeviceData: {
          update: {
            DeviceDataPress: {
              create: {},
            },
          },
        },
      },
      select: {
        id: true,
      },
    });

    return await this.getDeviceById(device.id, true);
  }
}
