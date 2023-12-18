import type { Prisma } from '@prisma/client';

export declare global {
  export interface GUser
    extends Prisma.UserGetPayload<{
      include: {
        UserAuth: {
          select: {
            username;
          };
        };
        UserInformation: {
          select: {
            imageUrl;
            displayName;
          };
        };
      };
    }> {}

  export interface GDevice
    extends Prisma.DeviceGetPayload<{
      include: {
        DeviceData: {
          select: {
            isRinging;
            DeviceDataPress: {
              select: {
                createdAt;
              };
            };
          };
        };
      };
    }> {}

  declare namespace Express {
    export interface Request {
      user?: User | null;
    }

    export interface User extends GUser {}
  }
}
