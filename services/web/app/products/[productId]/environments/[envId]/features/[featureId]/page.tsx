import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EditFeatureForm } from '@/components/edit-feature-form';
import { getEnvironmentById } from '@/lib/apiHandlers/environments';
import { getFeatureFlagById } from '@/lib/apiHandlers/flags';
import { getProductById } from '@/lib/apiHandlers/products';

export default async function FeatureDetailPage({ params }: { params: Promise<{ featureId: string }> }) {
  const { featureId } = await params;
  const feature = await getFeatureFlagById(featureId);
  if (!feature) return notFound();

  const [product, environment] = await Promise.all([
    getProductById(feature.productId),
    getEnvironmentById(feature.envId),
  ]);

  return (
    <div className="container mx-auto py-8">
      <div className="text-muted-foreground mb-2 flex items-center gap-2 text-sm">
        <Link href="/products" className="hover:underline">
          Products
        </Link>
        <span>/</span>
        {product && (
          <>
            <Link href={`/products/${product.id}`} className="hover:underline">
              {product.name}
            </Link>
            <span>/</span>
          </>
        )}
        {environment && (
          <>
            <Link href={`/products/${feature.productId}/environments/${feature.envId}`} className="hover:underline">
              {environment.name}
            </Link>
            <span>/</span>
          </>
        )}
        <span>{feature.label}</span>
      </div>

      <div className="mb-6">
        <h1 className="text-3xl font-bold">Feature</h1>
        <p className="text-muted-foreground mt-1">Edit feature flag settings</p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Edit Feature</CardTitle>
        </CardHeader>
        <CardContent>
          <EditFeatureForm feature={feature} />
        </CardContent>
      </Card>
    </div>
  );
}
