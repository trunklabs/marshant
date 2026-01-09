import Link from 'next/link';
import Image from 'next/image';
import { cn } from '@/lib/utils';

type LogoProps = {
  size?: 'sm' | 'default';
  asLink?: boolean;
  path?: string;
};

export function Logo({ size = 'default', asLink = true, path = '/' }: LogoProps) {
  const imageSize = size === 'sm' ? 28 : 36;

  const content = (
    <>
      <Image
        src="/logo.webp"
        alt="Marcurry Logo"
        width={imageSize}
        height={imageSize}
        className={cn('object-contain', size === 'sm' ? 'h-7 w-7' : 'h-9 w-9')}
        priority
      />
      <span className={cn('font-semibold', size === 'sm' ? 'text-base' : 'text-xl')}>Marcurry</span>
    </>
  );

  if (asLink) {
    return (
      <Link href={path} className="flex items-center gap-2">
        {content}
      </Link>
    );
  }

  return <div className="flex items-center gap-2">{content}</div>;
}
