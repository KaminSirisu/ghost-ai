import Link from "next/link";
import { LockKeyhole } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function AccessDenied() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-base px-6 text-center text-copy-primary">
      <div className="flex max-w-md flex-col items-center">
        <div className="flex size-14 items-center justify-center rounded-2xl border border-surface-border bg-surface text-copy-secondary">
          <LockKeyhole className="h-6 w-6" aria-hidden="true" />
        </div>
        <h1 className="mt-5 text-2xl font-semibold tracking-normal text-copy-primary">
          Access denied
        </h1>
        <p className="mt-3 text-sm leading-6 text-copy-muted">
          This project does not exist, or you do not have permission to open it.
        </p>
        <Link
          href="/editor"
          className={cn(buttonVariants({ variant: "outline" }), "mt-7")}
        >
          Back to projects
        </Link>
      </div>
    </main>
  );
}
