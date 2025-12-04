'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Boxes, ToggleRight } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { ThemeToggle } from '../../components/ui/theme-toggle';

export function Navigation(props: React.HTMLAttributes<HTMLElement>) {
  const pathname = usePathname();
  const navItems = [
    { href: '/', label: 'Feature Flags', icon: ToggleRight },
    { href: '/products', label: 'Projects', icon: Boxes },
  ];

  return (
    <nav className={cn('border-b', props.className)}>
      <div className="px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2">
              <Image
                src="/mar-curry-icon-transparent.png"
                alt="MarCurry Logo"
                width="96"
                height="60"
                className="mr-0"
              />
            </Link>
            <div className="flex gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link key={item.href} href={item.href}>
                    <Button variant={pathname === item.href ? 'secondary' : 'ghost'} size="sm" className="m-1 gap-2">
                      <Icon className="h-4 w-4" />
                      {item.label}
                    </Button>
                  </Link>
                );
              })}
            </div>
          </div>
          <div className="right-0 flex gap-2">
            <ThemeToggle />
          </div>
        </div>
      </div>
    </nav>
  );
}
