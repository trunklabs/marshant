'use client';

import { Building2 } from 'lucide-react';
import { OrganizationSwitcher } from '@daveyplate/better-auth-ui';
import { Button } from '@/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/ui/card';
import { useRouter } from 'next/navigation';

/**
 * Component displayed when a user is not part of any organization.
 * Blocks access to the application until they create or join an organization.
 */
export function OrganizationPrompt() {
  const router = useRouter();

  const handleOrganizationCreated = (organization: unknown) => {
    if (organization) {
      // Refresh the page to re-evaluate the organization guard
      router.refresh();
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="bg-primary/10 mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full">
            <Building2 className="text-primary h-6 w-6" />
          </div>
          <CardTitle className="text-2xl">Welcome to Feature Flags</CardTitle>
          <CardDescription>
            To get started, you need to be part of an organization. Create a new one or join an existing organization
            via an invitation.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <OrganizationSwitcher
            // hidePersonal
            onSetActive={handleOrganizationCreated}
            trigger={
              <Button className="w-full" size="lg">
                <Building2 className="mr-2 h-4 w-4" />
                Create or Join Organization
              </Button>
            }
          />
          <p className="text-muted-foreground text-center text-sm">
            To join an existing organization, ask an administrator to send you an invitation to your email address.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
