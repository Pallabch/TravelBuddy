"use client";

import Link from "next/link";
import { useLinkStatus } from "next/link";
import type { ComponentProps } from "react";

type Props = ComponentProps<typeof Link> & {
  pendingClassName?: string;
};

/** Link that soft-pulses as soon as it is clicked, before the next page arrives. */
export function PendingLink({ className = "", pendingClassName = "", children, ...props }: Props) {
  return (
    <Link {...props} className={`relative ${className}`}>
      {children}
      <PendingGlow className={pendingClassName} />
    </Link>
  );
}

function PendingGlow({ className }: { className: string }) {
  const { pending } = useLinkStatus();
  return (
    <span
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 rounded-[inherit] transition-opacity duration-150 ${
        pending ? `animate-pending-pulse opacity-100 ${className}` : "opacity-0"
      }`}
    />
  );
}
