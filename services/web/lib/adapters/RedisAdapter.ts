import { Redis } from 'ioredis';
import type { Environment, FeatureFlag, GateActors, GateAll, ID, Product } from '../db/types';
import type { StorageAdapter } from '../db/StorageAdapter';
import { nowIso, toSnakeCase } from '../db/utils';

const H_PRODUCTS = 'products';
const H_ENVIRONMENTS = 'environments';
const H_FLAGS = 'flags';

export class RedisAdapter implements StorageAdapter {
  private redis: Redis;

  constructor(client: Redis) {
    this.redis = client;
  }

  async createProduct(product: Omit<Product, 'id' | 'createdAt'>) {
    const id = toSnakeCase(product.name);
    const r: Product = { id, createdAt: nowIso(), ...product };
    await this.redis.hset(H_PRODUCTS, id, JSON.stringify(r));
    return r;
  }

  async getProduct(id: ID) {
    const data = await this.redis.hget(H_PRODUCTS, id);
    return data ? (JSON.parse(data) as Product) : null;
  }

  async updateProduct(id: ID, patch: Partial<Omit<Product, 'id' | 'name' | 'createdAt'>>) {
    const data = await this.redis.hget(H_PRODUCTS, id);
    if (!data) throw new Error(`product not found: ${id}`);

    const cur = JSON.parse(data) as Product;
    const updated = { ...cur, description: patch.description ?? cur.description };

    await this.redis.hset(H_PRODUCTS, id, JSON.stringify(updated));
    return updated;
  }

  async deleteProduct(id: ID) {
    const allEnvs = await this.listEnvironments();
    const envIdsToDelete = allEnvs.filter((env) => env.productId === id).map((env) => env.id);

    const allFlags = await this.listFeatureFlags();
    const flagIdsToDelete = allFlags.filter((flag) => flag.productId === id).map((flag) => flag.id);

    const multi = this.redis.multi();
    if (envIdsToDelete.length > 0) {
      multi.hdel(H_ENVIRONMENTS, ...envIdsToDelete);
    }
    if (flagIdsToDelete.length > 0) {
      multi.hdel(H_FLAGS, ...flagIdsToDelete);
    }
    multi.hdel(H_PRODUCTS, id);

    await multi.exec();
  }

  async listProducts() {
    const all = await this.redis.hvals(H_PRODUCTS);
    return all.map((data) => JSON.parse(data) as Product);
  }

  async createEnvironment(env: Omit<Environment, 'id' | 'createdAt'>) {
    const id = toSnakeCase(env.name);
    const r: Environment = { id, createdAt: nowIso(), ...env };
    await this.redis.hset(H_ENVIRONMENTS, id, JSON.stringify(r));
    return r;
  }

  async getEnvironment(id: ID) {
    const data = await this.redis.hget(H_ENVIRONMENTS, id);
    return data ? (JSON.parse(data) as Environment) : null;
  }

  async updateEnvironment(id: ID, patch: Partial<Omit<Environment, 'id' | 'name' | 'createdAt'>>) {
    const data = await this.redis.hget(H_ENVIRONMENTS, id);
    if (!data) throw new Error(`environment not found: ${id}`);

    const cur = JSON.parse(data) as Environment;
    const updated = { ...cur, description: patch.description ?? cur.description };

    await this.redis.hset(H_ENVIRONMENTS, id, JSON.stringify(updated));
    return updated;
  }

  async deleteEnvironment(id: ID) {
    // Mimics the In-Memory cascade delete
    const allFlags = await this.listFeatureFlags();
    const flagIdsToDelete = allFlags.filter((flag) => flag.envId === id).map((flag) => flag.id);

    const multi = this.redis.multi();
    if (flagIdsToDelete.length > 0) {
      multi.hdel(H_FLAGS, ...flagIdsToDelete);
    }
    multi.hdel(H_ENVIRONMENTS, id);

    await multi.exec();
  }

  async listEnvironments(productId?: ID) {
    const all = await this.redis.hvals(H_ENVIRONMENTS);
    const allEnvs = all.map((data) => JSON.parse(data) as Environment);

    return typeof productId === 'undefined' ? allEnvs : allEnvs.filter((e) => e.productId === productId);
  }

  async createFeatureFlag(flag: Omit<FeatureFlag, 'id' | 'createdAt'>) {
    const productExists = await this.redis.hexists(H_PRODUCTS, flag.productId);
    if (!productExists) throw new Error(`product not found: ${flag.productId}`);

    const envExists = await this.redis.hexists(H_ENVIRONMENTS, flag.envId);
    if (!envExists) throw new Error(`environment not found: ${flag.envId}`);

    if (!flag.label || typeof flag.label !== 'string') throw new Error('feature flag label is required');
    if (typeof flag.enabled !== 'boolean') throw new Error('feature flag enabled (boolean) is required');

    const id = toSnakeCase(flag.label);

    const flagExists = await this.redis.hexists(H_FLAGS, id);
    if (flagExists) throw new Error(`feature flag already exists: ${id}`);

    const r: FeatureFlag = {
      id,
      createdAt: nowIso(),
      productId: flag.productId,
      envId: flag.envId,
      label: flag.label,
      description: flag.description,
      enabled: flag.enabled,
      gates: flag.gates ?? [],
    };

    await this.redis.hset(H_FLAGS, id, JSON.stringify(r));
    return r;
  }

  async getFeatureFlag(id: ID) {
    const data = await this.redis.hget(H_FLAGS, id);
    return data ? (JSON.parse(data) as FeatureFlag) : null;
  }

  async updateFeatureFlag(id: ID, patch: Partial<Omit<FeatureFlag, 'id' | 'name' | 'createdAt'>>) {
    const data = await this.redis.hget(H_FLAGS, id);
    if (!data) throw new Error(`feature flag not found: ${id}`);

    const cur = JSON.parse(data) as FeatureFlag;
    const updated = { ...cur, description: patch.description ?? cur.description };

    console.log(updated);
    await this.redis.hset(H_FLAGS, id, JSON.stringify(updated));
    return updated;
  }

  async deleteFeatureFlag(id: ID) {
    await this.redis.hdel(H_FLAGS, id);
  }

  async listFeatureFlags(productId?: ID, envId?: ID) {
    const all = await this.redis.hvals(H_FLAGS);
    const allFlags = all.map((data) => JSON.parse(data) as FeatureFlag);

    return allFlags.filter((f) => (productId ? f.productId === productId : true) && (envId ? f.envId === envId : true));
  }

  async getEnabledFlagsForActor(productId: ID, envId: ID, actorId: string) {
    const flags = await this.listFeatureFlags(productId, envId);
    return flags.filter((flag) => this.flagEnabledForActor(flag, actorId));
  }

  private flagEnabledForActor(flag: FeatureFlag, actorId: string) {
    if (!flag.enabled) return false;

    if (!flag.gates || flag.gates.length === 0) return false;

    for (const g of flag.gates) {
      if (g.type === 'all') {
        const ga = g as GateAll;
        if (ga.enabled) return true;
      }

      if (g.type === 'actors') {
        const gu = g as GateActors;
        if (gu.actorIds.includes(actorId)) return true;
      }
    }

    return false;
  }
}

export default RedisAdapter;
