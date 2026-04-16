import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex field-sizing-content min-h-16 w-full rounded-xl border border-border bg-card/60 px-3.5 py-2.5 text-[14px] backdrop-blur-sm transition-all duration-150 outline-none placeholder:text-muted-foreground/60",
        "hover:border-border/80 focus-visible:border-primary/60 focus-visible:ring-2 focus-visible:ring-primary/25 focus-visible:bg-card",
        "disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/25",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
