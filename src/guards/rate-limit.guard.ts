import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { randomUUID } from 'crypto';
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  Inject,
  HttpException,
  HttpStatus,
} from '@nestjs/common';

@Injectable()
export class RateLimitGuard implements CanActivate {
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    // get user ip from request
    const ip: string = request.ip;
    const ipKey = `ip:${ip}`;

    // get the user from the request query
    const user: number = request.query.user;
    const userKey = `user:${user}`;

    // get the request counts for the IP and user
    const ipCount =
      (await this.cacheManager.store.keys(`${ipKey}-*`))?.length || 0;
    const userCount =
      (await this.cacheManager.store.keys(`${userKey}-*`))?.length || 0;

    // check the request counts
    if (ipCount >= 10 || userCount >= 5) {
      throw new HttpException(
        {
          ip: ipCount,
          id: userCount,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    // update the request counts
    await this.cacheManager.set(
      `${ipKey}-${randomUUID()}`,
      new Date().getTime(),
      { ttl: 60 } as any,
    );
    await this.cacheManager.set(
      `${userKey}-${randomUUID()}`,
      new Date().getTime(),
      { ttl: 60 } as any,
    );

    return true;
  }
}
