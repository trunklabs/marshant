import type { Environment, FeatureFlag, ID, Product } from './types';

export interface StorageAdapter {
  createProduct(product: Omit<Product, 'id' | 'createdAt'>): Promise<Product>;
  getProduct(id: ID): Promise<Product | null>;
  updateProduct(id: ID, patch: Partial<Omit<Product, 'id' | 'name' | 'createdAt'>>): Promise<Product>;
  deleteProduct(id: ID): Promise<void>;
  listProducts(): Promise<Product[]>;

  createEnvironment(env: Omit<Environment, 'id' | 'createdAt'>): Promise<Environment>;
  getEnvironment(id: ID): Promise<Environment | null>;
  updateEnvironment(id: ID, patch: Partial<Omit<Environment, 'id' | 'name' | 'createdAt'>>): Promise<Environment>;
  deleteEnvironment(id: ID): Promise<void>;
  listEnvironments(productId?: ID): Promise<Environment[]>;

  createFeatureFlag(flag: Omit<FeatureFlag, 'id' | 'createdAt'>): Promise<FeatureFlag>;
  getFeatureFlag(id: ID): Promise<FeatureFlag | null>;
  updateFeatureFlag(id: ID, patch: Partial<Omit<FeatureFlag, 'id' | 'name' | 'createdAt'>>): Promise<FeatureFlag>;
  deleteFeatureFlag(id: ID): Promise<void>;
  listFeatureFlags(productId?: ID, envId?: ID): Promise<FeatureFlag[]>;

  getEnabledFlagsForActor(productId: ID, envId: ID, actorId: string): Promise<FeatureFlag[]>;
}
