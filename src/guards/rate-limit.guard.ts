import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  Inject,
} from '@nestjs/common';

@Injectable()
export class RateLimitGuard implements CanActivate {
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const value = await this.cacheManager.get('key');
    console.log(value);

    // get user ip from request
    const ip: string = request.ip;
    console.log(ip);

    // get the user from the request query
    const user: number = request.query.user;
    console.log(user);

    return true;
  }
}
