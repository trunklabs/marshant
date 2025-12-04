import { ProductsTable, type ProductRow } from '@/components/products-table';
import { CreateProjectInline } from '@/components/create-project-inline';
import { EditProductDialog } from '@/components/edit-product-dialog';
import { listProjectsAction, listEnvironmentsAction, listFlagsAction } from '@/app/actions';
import type { Project } from '@marcurry/core';

export const dynamic = 'force-dynamic';

export default async function ProductsPage() {
  const products: Project[] = await listProjectsAction();

  const rows: ProductRow[] = await Promise.all(
    products.map(async (product) => {
      const [envs, flags] = await Promise.all([listEnvironmentsAction(product.id), listFlagsAction(product.id)]);
      return {
        product,
        envCount: envs.length,
        flagCount: flags.length,
      } satisfies ProductRow;
    })
  );

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6 flex min-h-12 items-center justify-between">
        <div>
          <div className="mt-1 flex items-center gap-2">
            <p className="text-muted-foreground">Manage your projects</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <CreateProjectInline />
        </div>
      </div>

      <ProductsTable items={rows} actions={(row) => <EditProductDialog product={row.product} />} />
    </div>
  );
}
