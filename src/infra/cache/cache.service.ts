import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

@Injectable()
export class CacheService {
  private isRedis: boolean;

  constructor(@Inject(CACHE_MANAGER) private cache: Cache) {
    this.isRedis = 'client' in this.cache.stores;
  }

  async get<T>(key: string): Promise<T | null> {
    const value = await this.cache.get<T>(key);
    return value ?? null;
  }

  async set(key: string, value: unknown, ttl = 30000): Promise<void> {
    await this.cache.set(key, value, ttl);
  }

  async del(key: string): Promise<void> {
    await this.cache.del(key);
  }

  async delByPattern(pattern: string): Promise<void> {
    if (this.isRedis) {
      const store = this.cache.stores as any;
      const keys: string[] = await store.client.keys(pattern);
      if (keys.length) await store.client.del(...keys);
    } else {
      const all = [...(await this.cache.stores.keys())];
      const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
      await Promise.all(
        all
          .filter((k) => regex.test(k.toString()))
          .map((k) => this.cache.del(k.toString())),
      );
    }
  }
}
