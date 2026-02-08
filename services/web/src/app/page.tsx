import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';

export default async function RootPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  redirect(session?.user ? '/app' : '/auth/sign-in');
}
