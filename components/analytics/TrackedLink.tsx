'use client';

import { track } from '@vercel/analytics';
import Link from 'next/link';
import type { ComponentProps } from 'react';

type TrackedLinkProps = ComponentProps<typeof Link> & {
  eventName: string;
  eventProperties: Record<string, string | number | boolean>;
};

export default function TrackedLink({ eventName, eventProperties, onClick, ...props }: TrackedLinkProps) {
  return (
    <Link
      {...props}
      onClick={(event) => {
        track(eventName, eventProperties);
        onClick?.(event);
      }}
    />
  );
}
