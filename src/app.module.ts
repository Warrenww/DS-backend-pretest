import { Module } from '@nestjs/common';
import { CacheModule, CacheModuleAsyncOptions } from '@nestjs/cache-manager';
import { AppController } from './app.controller';
import { AppService } from './app.service';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const redisStore = require('cache-manager-redis-store').redisStore;

const RedisOptions: CacheModuleAsyncOptions = {
  isGlobal: true,
  useFactory: async () => {
    const store = redisStore({
      socket: {
        host: 'localhost',
        port: '6379',
      },
    });
    return {
      store: () => store,
    };
  },
};

@Module({
  imports: [CacheModule.registerAsync(RedisOptions)],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
