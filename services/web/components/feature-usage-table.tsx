// Note: Do NOT mark this entire file with 'use server'.
// This is a Server Component by default in Next.js App Router.
// Inline server actions inside <form action={...}> blocks will include 'use server'.

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2 } from 'lucide-react';
import Link from 'next/link';
import type { FeatureFlag } from '@/lib/db/types';

import { deleteFeature } from '@/app/actions/featureActions';

function truncateText(text: string | undefined, maxLength: number): string {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

export function FeaturesTable({
  features,
  allowDelete,
  actions,
}: {
  features: FeatureFlag[];
  allowDelete: boolean;
  actions?: (f: FeatureFlag) => React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Features</CardTitle>
        <CardDescription>List of all feature flags</CardDescription>
      </CardHeader>
      <CardContent>
        {features.length === 0 ? (
          <p className="text-muted-foreground py-8 text-center text-sm">No features yet</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Label</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Environment</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[1%]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {features.map((feature) => {
                return (
                  <TableRow key={feature.id} className="hover:bg-muted transition-colors">
                    <TableCell className="font-medium">{feature.label}</TableCell>
                    <TableCell className="text-muted-foreground">{feature.productId ?? '-'}</TableCell>
                    <TableCell className="text-muted-foreground">{feature.envId ?? '-'}</TableCell>
                    <TableCell className="text-muted-foreground">{truncateText(feature.description, 50)}</TableCell>
                    <TableCell>
                      <Badge variant={feature.enabled ? 'default' : 'secondary'}>
                        {feature.enabled ? 'On' : 'Off'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Link
                          href={`products/${feature.productId}/environments/${feature.envId}/features/${feature.id}`}
                        >
                          <Button size="sm" variant="ghost">
                            <Pencil className="mr-1 h-4 w-4" />
                            Edit
                          </Button>
                        </Link>
                        {actions ? actions(feature) : null}
                        {allowDelete ? (
                          <form
                            action={async () => {
                              'use server';
                              await deleteFeature(feature.id);
                            }}
                          >
                            <Button size="sm" variant="ghost" type="submit" className="text-destructive">
                              <Trash2 className="mr-1 h-4 w-4" />
                              Delete
                            </Button>
                          </form>
                        ) : null}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
