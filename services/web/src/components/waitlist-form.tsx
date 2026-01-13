'use client';

import { useState } from 'react';
import { Button } from '@/ui/button';
import { Input } from '@/ui/input';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormField, FormItem, FormMessage } from '@/ui/form';
import { Loader2Icon } from 'lucide-react';

const waitlistSchema = z.object({
  email: z.email('Please enter a valid email address'),
});

type WaitlistFormData = z.infer<typeof waitlistSchema>;

export function WaitlistForm() {
  const [submitted, setSubmitted] = useState(false);

  const form = useForm<WaitlistFormData>({
    resolver: zodResolver(waitlistSchema),
    defaultValues: {
      email: '',
    },
  });

  async function onSubmit(data: WaitlistFormData) {
    console.log('Waitlist signup:', data.email);
    setSubmitted(true);
  }

  if (submitted) {
    return <p className="text-muted-foreground text-sm">Thanks! We&apos;ll notify you when Marshant Cloud launches.</p>;
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="mx-auto mt-6 flex max-w-md flex-col gap-2">
        <div className="flex gap-2">
          <FormField
            name="email"
            render={({ field, fieldState }) => (
              <FormItem className="flex-1">
                <Input
                  {...field}
                  type="email"
                  placeholder="Enter your email"
                  disabled={form.formState.isSubmitting}
                  aria-invalid={fieldState.invalid}
                />
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? <Loader2Icon className="animate-spin" /> : 'Join Waitlist'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
