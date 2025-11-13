export type ClientOptions = {
  product: string;
  environment: string;
}

export type Client = {
  enabled(featureFlagKey: string, actorId: string): Promise<boolean>
}

export function createClient(options: ClientOptions): Client {
  // TODO: implement connection to APIs
  console.log(options)

  return {
    enabled(featureFlagKey: string, actorId: string): Promise<boolean> {
      return Promise.resolve(true)
    }
  }
}

