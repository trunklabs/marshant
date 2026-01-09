import { AccountView } from '@daveyplate/better-auth-ui';
import { accountViewPaths } from '@daveyplate/better-auth-ui/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { paths } from '@/server/paths';

export const dynamicParams = false;

export function generateStaticParams() {
  return Object.values(accountViewPaths).map((path) => ({ path }));
}

export default async function AccountPage({ params }: { params: Promise<{ path: string }> }) {
  const { path } = await params;
  const session = await auth.api.getSession({ headers: await headers() });
  const isLoggedIn = !!session?.user;

  if (!isLoggedIn) {
    return redirect(paths.SIGN_IN);
  }

  return (
    <main className="container p-4 md:p-6">
      <AccountView path={path} />
    </main>
  );
}
