'use client';

import { useRouter } from 'next/navigation';

export default function AppError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const router = useRouter();

  return (
    <div className="flex flex-1 items-center justify-center p-4">
      <div className="text-center">
        <h1 className="text-2xl font-bold">Something went wrong</h1>
        <p className="text-muted-foreground mt-2">An error occurred while loading this page.</p>
        <div className="mt-4 flex justify-center gap-2">
          <button
            onClick={reset}
            className="bg-primary text-primary-foreground rounded-md px-4 py-2 text-sm font-medium"
          >
            Try again
          </button>
          <button
            onClick={() => router.push('/app')}
            className="bg-secondary text-secondary-foreground rounded-md px-4 py-2 text-sm font-medium"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
