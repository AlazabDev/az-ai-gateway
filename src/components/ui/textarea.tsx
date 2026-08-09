import * as React from "react"

import { cn } from "@/lib/utils"

type NativeTextareaProps = Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, "disabled">

export interface TextareaProps extends NativeTextareaProps {
  disabled?: boolean | null
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, disabled, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        disabled={Boolean(disabled)}
        ref={ref}
        {...props}
      />
    )
  }
)
Textarea.displayName = "Textarea"

export { Textarea }
