'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { OrganizationSwitcher, UserButton } from '@daveyplate/better-auth-ui';
import { NavMain } from '@/components/nav-main';
import { ModeToggle } from '@/components/mode-toggle';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuItem } from '@/ui/sidebar';
import { invalidateSessionCache } from '@/server/session-cache';

const navMain = [
  {
    title: 'Dashboard',
    url: '/app',
    icon: 'dashboard' as const,
  },
  {
    title: 'Projects',
    url: '/app/projects',
    icon: 'folder' as const,
  },
  {
    title: 'Feature Flags',
    url: '/app/flags',
    icon: 'flag' as const,
  },
];

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const router = useRouter();

  const handleOrganizationChange = () => {
    React.startTransition(async () => {
      await invalidateSessionCache();
      router.refresh();
    });
  };

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <OrganizationSwitcher className="w-full" onSetActive={handleOrganizationChange} />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMain} />
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <UserButton className="w-full" additionalLinks={[<ModeToggle key="mode-toggle" variant="menu" />]} />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
