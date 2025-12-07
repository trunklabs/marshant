import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/ui/table';
import { Button } from '@/ui/button';
import { Pencil, Trash2 } from 'lucide-react';
import Link from 'next/link';
import type { Project } from '@marcurry/core';
import { deleteProjectAction } from '@/app/actions/projects';

export interface ProductRow {
  product: Project;
  envCount: number;
  flagCount: number;
}

export function ProductsTable({
  items,
  actions,
}: {
  items: ProductRow[];
  actions?: (p: ProductRow) => React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Projects</CardTitle>
        <CardDescription>List of projects and their usage</CardDescription>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-muted-foreground py-8 text-center text-sm">No projects yet</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Environments</TableHead>
                <TableHead>Flags</TableHead>
                <TableHead className="w-[1%]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((row) => (
                <TableRow key={row.product.id}>
                  <TableCell className="font-medium">{row.product.name}</TableCell>
                  <TableCell>{row.envCount}</TableCell>
                  <TableCell>{row.flagCount}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {actions ? (
                        actions(row)
                      ) : (
                        <Link href={`/?projectId=${row.product.id}`}>
                          <Button size="sm" variant="outline">
                            <Pencil className="mr-1 h-4 w-4" />
                            Edit
                          </Button>
                        </Link>
                      )}
                      <form
                        action={async () => {
                          'use server';
                          await deleteProjectAction(row.product.id);
                        }}
                      >
                        <Button size="sm" variant="destructive" type="submit">
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
