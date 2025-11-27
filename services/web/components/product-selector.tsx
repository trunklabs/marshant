'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Product } from '@/lib/db/types';

export function ProductSelector({
  products,
  isEnvironmentPage = false,
}: {
  products: Product[];
  isEnvironmentPage?: boolean;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentProductId = searchParams.get('productId') || '';

  const handleChange = (productId: string) => {
    const environmentsUrl = '/environments';
    const rootUrl = '/';
    const urlToUse = isEnvironmentPage ? environmentsUrl : rootUrl;

    if (productId === 'all') {
      router.push(urlToUse);
      return;
    }

    router.push(`${urlToUse}?productId=${productId}`);
  };

  if (products.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center gap-2">
      <label htmlFor="product-select" className="text-sm font-medium">
        Product:
      </label>
      <Select value={currentProductId || 'all'} onValueChange={handleChange}>
        <SelectTrigger id="product-select" className="w-[200px]">
          <SelectValue placeholder="Select product" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Products</SelectItem>
          {products.map((product) => (
            <SelectItem key={product.id} value={product.id}>
              {product.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
