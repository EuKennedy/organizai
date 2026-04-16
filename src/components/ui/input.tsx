import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "h-10 w-full min-w-0 rounded-xl border border-border bg-card/60 px-3.5 py-1 text-[14px] backdrop-blur-sm transition-all duration-150 outline-none selection:bg-primary/30 selection:text-foreground file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground/60 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        "hover:border-border/80",
        "focus-visible:border-primary/60 focus-visible:ring-2 focus-visible:ring-primary/25 focus-visible:bg-card",
        "aria-invalid:border-destructive aria-invalid:ring-destructive/25",
        className
      )}
      {...props}
    />
  )
}

export { Input }
