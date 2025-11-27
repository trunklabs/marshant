import { notFound } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EnvironmentsTable, type EnvironmentRow } from '@/components/environments-table';
import { CreateEnvironmentInline } from '@/components/create-environment-inline';
import { EditProductForm } from '@/components/edit-product-form';
import Link from 'next/link';
import { listEnvironments } from '@/lib/apiHandlers/environments';
import { listFeatureFlags } from '@/lib/apiHandlers/flags';
import { getProductById } from '@/lib/apiHandlers/products';

export default async function ProductDetailPage({ params }: { params: Promise<{ productId: string }> }) {
  const { productId } = await params;
  const product = await getProductById(productId);
  if (!product) return notFound();

  const envs = await listEnvironments({ productId });
  const rows: EnvironmentRow[] = await Promise.all(
    envs.map(async (env) => {
      const features = await listFeatureFlags({ productId, envId: env.id });
      return { environment: env, featureCount: features.length } satisfies EnvironmentRow;
    })
  );

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Product</h1>
          <p className="text-muted-foreground mt-1">Manage environments and settings</p>
        </div>
        <CreateEnvironmentInline productId={product.id} />
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Edit Product</CardTitle>
        </CardHeader>
        <CardContent>
          <EditProductForm product={product} />
        </CardContent>
      </Card>

      <div className="text-muted-foreground mb-2 flex items-center gap-2 text-sm">
        <Link href="/products" className="hover:underline">
          Products
        </Link>
        <span>/</span>
        <span>{product.name}</span>
      </div>

      <EnvironmentsTable items={rows} />
    </div>
  );
}
