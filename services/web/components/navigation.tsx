'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Flag, BarChart3 } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

export function Navigation(props: React.HTMLAttributes<HTMLElement>) {
  const pathname = usePathname();
  const navItems = [
    { href: '/', label: 'Home', icon: BarChart3 },
    { href: '/products', label: 'Products', icon: Flag },
    // { href: '/features', label: 'Features', icon: Flag },
  ];

  return (
    <nav className={cn('border-b', props.className)}>
      <div className="px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2">
              <img src="/mar-curry-icon-transparent.png" alt="MarCurry Logo" className="h-15 mr-0 w-24" />
            </Link>
            <div className="flex gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link key={item.href} href={item.href}>
                    <Button variant={pathname === item.href ? 'secondary' : 'ghost'} size="sm" className="gap-2">
                      <Icon className="h-4 w-4" />
                      {item.label}
                    </Button>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
