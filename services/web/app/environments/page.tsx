import { Flag } from 'lucide-react';
import { ProductSelector } from '@/components/product-selector';
import { CreateProductInline } from '@/components/create-product-inline';
import { Suspense } from 'react';
import { Badge } from '@/components/ui/badge';
import { type EnvironmentRow, EnvironmentsTable } from '@/components/environments-table';
import { listEnvironments } from '@/lib/apiHandlers/environments';
import { listFeatureFlags } from '@/lib/apiHandlers/flags';
import { listProducts } from '@/lib/apiHandlers/products';

export default async function Environments({
  searchParams,
}: {
  searchParams: Promise<{ productId?: string; envId?: string }>;
}) {
  const params = await searchParams;
  const productId = params.productId;

  const [products, environments] = await Promise.all([
    listProducts(),
    listEnvironments(productId ? { productId } : {}),
  ]);

  const rows: EnvironmentRow[] = await Promise.all(
    environments.map(async (env) => {
      const features = await listFeatureFlags({ productId, envId: env.id });
      return { environment: env, featureCount: features.length } satisfies EnvironmentRow;
    })
  );

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6 flex min-h-12 items-center justify-between">
        <div>
          <div className="mt-1 flex items-center gap-2">
            <p className="text-muted-foreground">Overview of your environment management</p>
            {products.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {environments.length} {environments.length === 1 ? 'environment' : 'environments'}
              </Badge>
            )}
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Suspense fallback={<div className="bg-muted h-10 w-[200px] animate-pulse rounded" />}>
            <ProductSelector products={products} isEnvironmentPage />
          </Suspense>

          {products.length === 0 && <CreateProductInline />}
        </div>
      </div>

      {products.length === 0 ? (
        <div className="border-muted-foreground/25 flex min-h-[400px] flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 text-center">
          <Flag className="text-muted-foreground/50 mb-4 h-12 w-12" />
          <h2 className="mb-2 text-xl font-semibold">No Products Yet</h2>
          <p className="text-muted-foreground mb-4">Get started by creating your first product</p>
          <CreateProductInline />
        </div>
      ) : (
        <EnvironmentsTable items={rows} />
      )}
    </div>
  );
}
