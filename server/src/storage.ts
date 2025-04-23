import Redis from "ioredis";

export class RedisStorage {
  protected redis: Redis;
  protected readonly prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
    this.redis = new Redis({
      host: process.env.REDIS_HOST || "localhost",
      port: parseInt(process.env.REDIS_PORT || "6379"),
      password: process.env.REDIS_PASSWORD,
    });
  }

  public async set(key: string, value: string) {
    await this.redis.set(`${this.prefix}${key}`, value);
  }

  public async get(key: string): Promise<string | null> {
    return await this.redis.get(`${this.prefix}${key}`);
  }

  public async delete(key: string) {
    await this.redis.del(`${this.prefix}${key}`);
  }

  public async clear() {
    const keys = await this.redis.keys(`${this.prefix}*`);
    if (keys.length > 0) {
      await this.redis.del(...keys);
    }
  }

  public async exists(key: string): Promise<boolean> {
    return (await this.redis.exists(`${this.prefix}${key}`)) === 1;
  }

  public async setWithExpiry(key: string, value: string, seconds: number) {
    await this.redis.setex(`${this.prefix}${key}`, seconds, value);
  }
}

export class PlayerNameStorage extends RedisStorage {
  constructor() {
    super("player:name:");
  }
}
