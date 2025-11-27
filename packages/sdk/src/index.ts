import { type FeatureFlag } from './../../../services/web/lib/db/types.js';
import { tryCatch } from './utils.js';

export type ClientOptions = {
  productId: string;
  envId: string;
};

export type Client = {
  enabledList(actorId: string): Promise<string[]>;
};

const WEB_SERVICE_URL = process.env.WEB_SERVICE_URL || 'http://localhost:3005';

export function createClient(options: ClientOptions): Client {
  async function fetchFromWebService(endpoint: string, params: Record<string, string> = {}): Promise<any> {
    const url = new URL(`${WEB_SERVICE_URL}${endpoint}`);
    Object.entries(params).forEach(([key, value]) => url.searchParams.append(key, value));

    const response = await fetch(url.toString());
    if (!response.ok) {
      throw new Error(`Failed to fetch from ${url}: ${response.statusText}`);
    }
    return response.json();
  }

  return {
    async enabledList(actorId: string): Promise<string[]> {
      const [error, flags] = await tryCatch(
        fetchFromWebService('/api/flags/enabled', {
          productId: options.productId,
          envId: options.envId,
          actorId,
        })
      );

      if (error) return [];

      return flags.map((flag: FeatureFlag) => flag.id);
    },
  };
}
