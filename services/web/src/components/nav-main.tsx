'use client';

import { IconDashboard, IconFolder, IconFlag } from '@tabler/icons-react';
import Link from 'next/link';

import { SidebarGroup, SidebarGroupContent, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/ui/sidebar';

const iconMap = {
  dashboard: IconDashboard,
  folder: IconFolder,
  flag: IconFlag,
};

export function NavMain({
  items,
}: {
  items: {
    title: string;
    url: string;
    icon?: keyof typeof iconMap;
  }[];
}) {
  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-2">
        <SidebarMenu>
          <SidebarMenuItem>
            {/*<DropdownMenu>*/}
            {/*  <DropdownMenuTrigger asChild>*/}
            {/*    <SidebarMenuButton*/}
            {/*      tooltip="Quick Create"*/}
            {/*      className="bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground active:bg-primary/90 active:text-primary-foreground min-w-8 duration-200 ease-linear"*/}
            {/*    >*/}
            {/*      <IconCirclePlusFilled />*/}
            {/*      <span>Quick Create</span>*/}
            {/*    </SidebarMenuButton>*/}
            {/*  </DropdownMenuTrigger>*/}
            {/*  <DropdownMenuContent side="bottom" className="w-48">*/}
            {/*    <DropdownMenuItem onSelect={() => setCreateProjectOpen(true)}>*/}
            {/*      <IconFolder className="mr-2 h-4 w-4" />*/}
            {/*      New Project*/}
            {/*    </DropdownMenuItem>*/}
            {/*    <DropdownMenuItem asChild>*/}
            {/*      <Link href="/app/flags">*/}
            {/*        <IconFlag className="mr-2 h-4 w-4" />*/}
            {/*        New Feature Flag*/}
            {/*      </Link>*/}
            {/*    </DropdownMenuItem>*/}
            {/*  </DropdownMenuContent>*/}
            {/*</DropdownMenu>*/}
            {/*<CreateProjectInline open={createProjectOpen} onOpenChange={setCreateProjectOpen} />*/}
          </SidebarMenuItem>
        </SidebarMenu>
        <SidebarMenu>
          {items.map((item) => {
            const IconComponent = item.icon ? iconMap[item.icon] : null;
            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton tooltip={item.title} asChild>
                  <Link href={item.url}>
                    {IconComponent && <IconComponent />}
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
