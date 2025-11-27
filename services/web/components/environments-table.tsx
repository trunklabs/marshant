import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { ExternalLink, Trash2 } from 'lucide-react';
import Link from 'next/link';
import type { Environment } from '@/lib/db/types';
import { deleteEnvironmentAction } from '@/app/actions/environmentActions';

export interface EnvironmentRow {
  environment: Environment;
  featureCount: number;
}

export function EnvironmentsTable({
  items,
  actions,
}: {
  items: EnvironmentRow[];
  actions?: (e: EnvironmentRow) => React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Environments</CardTitle>
        <CardDescription>List of all environments and their usage</CardDescription>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-muted-foreground py-8 text-center text-sm">No environments yet</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Features</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="w-[1%]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((row) => (
                <TableRow key={row.environment.id}>
                  <TableCell className="font-medium">{row.environment.name}</TableCell>
                  <TableCell>{row.environment.productId}</TableCell>
                  <TableCell>{row.featureCount}</TableCell>
                  <TableCell className="text-muted-foreground">{row.environment.description ?? ''}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Link href={`/products/${row.environment.productId}/environments/${row.environment.id}`}>
                        <Button size="sm" variant="ghost">
                          <ExternalLink className="mr-1 h-4 w-4" />
                          Open
                        </Button>
                      </Link>
                      {actions ? actions(row) : null}
                      <form
                        action={async () => {
                          'use server';
                          await deleteEnvironmentAction(row.environment.id);
                        }}
                      >
                        <Button size="sm" variant="ghost" type="submit" className="text-destructive">
                          <Trash2 className="mr-1 h-4 w-4" />
                          Delete
                        </Button>
                      </form>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
