import type { ID, Product, Environment, FeatureFlag, GateAll, GateActors, Gate } from './types';
import type { StorageAdapter } from './StorageAdapter';

function createId(prefix = 'id'): ID {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function nowIso() {
  return new Date().toISOString();
}

export class InMemoryAdapter implements StorageAdapter {
  private products = new Map<ID, Product>();
  private environments = new Map<ID, Environment>();
  private flags = new Map<ID, FeatureFlag>();

  // Products
  async createProduct(product: Omit<Product, 'id' | 'createdAt'>) {
    const id = createId('prod');
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
    // also cascade-delete environments and flags for that product
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

  // Environments
  async createEnvironment(env: Omit<Environment, 'id' | 'createdAt'>) {
    const id = createId('env');
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
    // cascade delete flags in env
    for (const [flagId, flag] of this.flags.entries()) {
      if (flag.envId === id) this.flags.delete(flagId);
    }
    this.environments.delete(id);
  }

  async listEnvironments(productId?: ID) {
    const all = Array.from(this.environments.values());
    return typeof productId === 'undefined' ? all : all.filter((e) => e.productId === productId);
  }

  // FeatureFlags
  async createFeatureFlag(flag: Omit<FeatureFlag, 'id' | 'createdAt'>) {
    // basic validation
    if (!this.products.has(flag.productId)) throw new Error(`product not found: ${flag.productId}`);
    if (!this.environments.has(flag.envId)) throw new Error(`environment not found: ${flag.envId}`);
    // ensure required fields are present (label and enabled are now mandatory)
    if (!flag.label || typeof flag.label !== 'string') throw new Error('feature flag label is required');
    if (typeof flag.enabled !== 'boolean') throw new Error('feature flag enabled (boolean) is required');
    const id = createId('flag');
    const r: FeatureFlag = { id, createdAt: nowIso(), ...flag, enabled: flag.enabled };
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

  // Evaluation
  async getEnabledFlagsForUser(productId: ID, envId: ID, actorId: string) {
    const flags = await this.listFeatureFlags(productId, envId);
    const enabled: FeatureFlag[] = [];

    for (const flag of flags) {
      if (this.flagEnabledForUser(flag, actorId)) enabled.push(flag);
    }

    return enabled;
  }

  private flagEnabledForUser(flag: FeatureFlag, actorId: string) {
    if (flag.enabled === false) return false;

    if (!flag.gates || flag.gates.length === 0) return false;

    for (const g of flag.gates) {
      if ((g as Gate).type === 'all') {
        const ga = g as GateAll;
        if (ga.enabled) return true;
      }

      if ((g as Gate).type === 'actors') {
        const gu = g as GateActors;
        if (gu.actorIds.includes(actorId)) return true;
      }
    }

    return false;
  }

  // group management removed
}

export default InMemoryAdapter;
