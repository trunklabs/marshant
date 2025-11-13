import type { ID, Product, Environment, FeatureFlag, GateAll, GateActors, Gate } from './types';
import type { StorageAdapter, NewFeatureFlag } from './StorageAdapter';
import { v4 } from 'uuid';

function nowIso() {
  return new Date().toISOString();
}

export class InMemoryAdapter implements StorageAdapter {
  private products = new Map<ID, Product>();
  private environments = new Map<ID, Environment>();
  private flags = new Map<ID, FeatureFlag>();

  async createProduct(product: Omit<Product, 'id' | 'createdAt'>) {
    const id = v4();
    const r: Product = { id, createdAt: nowIso(), ...product };
    this.products.set(id, r);
    return r;
  }

  async getProduct(id: ID) {
    return this.products.get(id) ?? null;
  }

  async updateProduct(id: ID, patch: Partial<Omit<Product, 'id' | 'createdAt'>>) {
    const cur = this.products.get(id);
    if (!cur) throw new Error(`product not found: ${id}`);
    const updated = { ...cur, ...patch };
    this.products.set(id, updated);
    return updated;
  }

  async deleteProduct(id: ID) {
    for (const [envId, env] of this.environments.entries()) {
      if (env.productId === id) this.environments.delete(envId);
    }
    for (const [flagId, flag] of this.flags.entries()) {
      if (flag.productId === id) this.flags.delete(flagId);
    }
    this.products.delete(id);
  }

  async listProducts() {
    return Array.from(this.products.values());
  }

  async createEnvironment(env: Omit<Environment, 'id' | 'createdAt'>) {
    const id = v4();
    const r: Environment = { id, createdAt: nowIso(), ...env };
    this.environments.set(id, r);
    return r;
  }

  async getEnvironment(id: ID) {
    return this.environments.get(id) ?? null;
  }

  async updateEnvironment(id: ID, patch: Partial<Omit<Environment, 'id' | 'createdAt'>>) {
    const cur = this.environments.get(id);
    if (!cur) throw new Error(`environment not found: ${id}`);
    const updated = { ...cur, ...patch };
    this.environments.set(id, updated);
    return updated;
  }

  async deleteEnvironment(id: ID) {
    for (const [flagId, flag] of this.flags.entries()) {
      if (flag.envId === id) this.flags.delete(flagId);
    }
    this.environments.delete(id);
  }

  async listEnvironments(productId?: ID) {
    const all = Array.from(this.environments.values());
    return typeof productId === 'undefined' ? all : all.filter((e) => e.productId === productId);
  }

  async createFeatureFlag(flag: NewFeatureFlag) {
    if (!this.products.has(flag.productId)) throw new Error(`product not found: ${flag.productId}`);
    if (!this.environments.has(flag.envId)) throw new Error(`environment not found: ${flag.envId}`);
    if (!flag.label || typeof flag.label !== 'string') throw new Error('feature flag label is required');
    if (typeof flag.enabled !== 'boolean') throw new Error('feature flag enabled (boolean) is required');

    const id = flag.id ? String(flag.id) : v4();
    if (this.flags.has(id)) throw new Error(`feature flag already exists: ${id}`);

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

    this.flags.set(id, r);
    return r;
  }

  async getFeatureFlag(id: ID) {
    return this.flags.get(id) ?? null;
  }

  async updateFeatureFlag(id: ID, patch: Partial<Omit<FeatureFlag, 'id' | 'createdAt'>>) {
    const cur = this.flags.get(id);
    if (!cur) throw new Error(`feature flag not found: ${id}`);
    const updated = { ...cur, ...patch };
    this.flags.set(id, updated);
    return updated;
  }

  async deleteFeatureFlag(id: ID) {
    this.flags.delete(id);
  }

  async listFeatureFlags(productId?: ID, envId?: ID) {
    const all = Array.from(this.flags.values());
    return all.filter((f) => (productId ? f.productId === productId : true) && (envId ? f.envId === envId : true));
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

export default InMemoryAdapter;
