import { cn } from "@/lib/utils";

/**
 * macOS-style browser window chrome used to frame in-app "screens",
 * mirroring the .mockup-frame pattern from the source PRD mockups.
 */
export function BrowserChrome({
  url,
  right,
  children,
  className,
  bodyClassName,
}: {
  url: string;
  right?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border border-rule bg-surface shadow-card",
        className,
      )}
    >
      <div className="flex items-center gap-2 border-b border-rule bg-surface-2 px-4 py-2.5">
        <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
        <div className="mx-3 flex h-5 flex-1 items-center truncate rounded bg-rule/60 px-2 font-mono text-[0.7rem] text-muted">
          {url}
        </div>
        {right}
      </div>
      <div className={bodyClassName}>{children}</div>
    </div>
  );
}
