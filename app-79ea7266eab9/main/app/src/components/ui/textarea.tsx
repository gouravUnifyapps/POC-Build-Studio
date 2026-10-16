import * as React from "react"

import { cn, hasTextSize } from "@/lib/utils"
import { testId } from "@/lib/testId"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      // fallback only — BEFORE the spread, so a call-site data-test-id wins
      data-test-id={testId("textarea", props.name, props.id, props.placeholder)}
      className={cn(
        "flex field-sizing-content min-h-16 w-full rounded-lg border border-input bg-transparent px-2.5 py-2 transition-colors outline-none placeholder:text-placeholder focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:bg-input/50 disabled:text-disabled-foreground disabled:placeholder:text-disabled-placeholder disabled:opacity-(--disabled-field-opacity) aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
        // default size only when the caller sets none, so theirs wins at every width
        !hasTextSize(className) && "text-base md:text-sm",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
