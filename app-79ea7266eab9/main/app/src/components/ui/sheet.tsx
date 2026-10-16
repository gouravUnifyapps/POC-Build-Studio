"use client"

import * as React from "react"
import { Dialog as SheetPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"
import { useMediaQuery } from "@/lib/useMediaQuery"
import { Button } from "@/components/ui/button"
import { XIcon } from "lucide-react"

// Tailwind's default breakpoints, as its own `sm:`…`2xl:` variants compile them.
const BREAKPOINTS = [
  ["sm", "40rem"],
  ["md", "48rem"],
  ["lg", "64rem"],
  ["xl", "80rem"],
  ["2xl", "96rem"],
] as const
const DISPLAY = /^(hidden|block|flex|grid|contents|table|flow-root|inline(-block|-flex|-grid)?)$/

/**
 * The media query under which `className` hides the sheet, or null when it never does.
 *
 * "Desktop aside, mobile drawer" keeps getting written as `<SheetContent className="lg:hidden">`,
 * and that is broken: the class reaches the PANEL only. The overlay is a sibling in the
 * portal, and the modal behaviour — focus trap, `pointer-events: none` on <body> — is
 * JavaScript, so on a wide screen every open() blurs and freezes the whole page with
 * nothing visible to close it. SheetContent reads the same classes and does not mount at
 * all where they would hide it. Mobile-first like Tailwind: the last display utility at or
 * below a width wins; `max-*:hidden` is honoured too.
 */
function hiddenQuery(className?: string): string | null {
  const tokens = (className ?? "").split(/\s+/)
  const shown = (prefix: string, current: boolean) => {
    const display = tokens.filter((t) => t.startsWith(prefix) && DISPLAY.test(t.slice(prefix.length))).pop()
    return display ? display !== `${prefix}hidden` : current
  }
  const queries: string[] = []
  let visible = shown("", true)
  if (!visible) queries.push(`(width < ${BREAKPOINTS[0][1]})`)
  BREAKPOINTS.forEach(([name, width], i) => {
    visible = shown(`${name}:`, visible)
    const next = BREAKPOINTS[i + 1]?.[1]
    if (!visible) queries.push(next ? `(${width} <= width < ${next})` : `(width >= ${width})`)
    if (tokens.includes(`max-${name}:hidden`)) queries.push(`(width < ${width})`)
  })
  return queries.length ? queries.join(", ") : null
}

function Sheet({ ...props }: React.ComponentProps<typeof SheetPrimitive.Root>) {
  return <SheetPrimitive.Root data-slot="sheet" {...props} />
}

function SheetTrigger({
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Trigger>) {
  return <SheetPrimitive.Trigger data-slot="sheet-trigger" {...props} />
}

function SheetClose({
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Close>) {
  return <SheetPrimitive.Close data-slot="sheet-close" {...props} />
}

function SheetPortal({
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Portal>) {
  return <SheetPrimitive.Portal data-slot="sheet-portal" {...props} />
}

function SheetOverlay({
  className,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Overlay>) {
  return (
    <SheetPrimitive.Overlay
      data-slot="sheet-overlay"
      className={cn(
        "fixed inset-0 z-50 bg-black/10 duration-100 supports-backdrop-filter:backdrop-blur-xs data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0",
        className
      )}
      {...props}
    />
  )
}

function SheetContent({
  className,
  children,
  side = "right",
  showCloseButton = true,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Content> & {
  side?: "top" | "right" | "bottom" | "left"
  showCloseButton?: boolean
}) {
  // "not all" never matches, so a sheet with no hiding classes always mounts.
  const hidden = useMediaQuery(hiddenQuery(className) ?? "not all")
  if (hidden) return null

  // Everything that is not the header or the footer becomes ONE scrolling region, so a
  // drawer written as plain children still scrolls instead of growing until it pushes
  // its footer off the bottom. Pass a SheetBody to take that region over yourself.
  const parts = React.Children.toArray(children)
  const isSlot = (node: React.ReactNode, ...kinds: React.ElementType[]) =>
    React.isValidElement(node) && kinds.includes(node.type as React.ElementType)
  const middle = parts.filter((node) => !isSlot(node, SheetHeader, SheetFooter))

  return (
    <SheetPortal>
      <SheetOverlay />
      <SheetPrimitive.Content
        data-slot="sheet-content"
        data-side={side}
        // The gutter lives here rather than on the header and footer, so anything
        // dropped straight into the sheet is inset on every side and can never come out
        // flush. A child that has to reach the edges opts out with -mx-4.
        className={cn(
          "fixed z-50 flex flex-col gap-4 p-4 bg-popover bg-clip-padding text-sm text-popover-foreground shadow-lg transition duration-200 ease-in-out data-[side=bottom]:inset-x-0 data-[side=bottom]:bottom-0 data-[side=bottom]:h-auto data-[side=bottom]:border-t data-[side=left]:inset-y-0 data-[side=left]:left-0 data-[side=left]:h-full data-[side=left]:w-3/4 data-[side=left]:border-e data-[side=right]:inset-y-0 data-[side=right]:right-0 data-[side=right]:h-full data-[side=right]:w-3/4 data-[side=right]:border-s data-[side=top]:inset-x-0 data-[side=top]:top-0 data-[side=top]:h-auto data-[side=top]:border-b data-[side=left]:sm:max-w-sm data-[side=right]:sm:max-w-sm data-open:animate-in data-open:fade-in-0 data-[side=bottom]:data-open:slide-in-from-bottom-10 data-[side=left]:data-open:slide-in-from-left-10 data-[side=right]:data-open:slide-in-from-right-10 data-[side=top]:data-open:slide-in-from-top-10 data-closed:animate-out data-closed:fade-out-0 data-[side=bottom]:data-closed:slide-out-to-bottom-10 data-[side=left]:data-closed:slide-out-to-left-10 data-[side=right]:data-closed:slide-out-to-right-10 data-[side=top]:data-closed:slide-out-to-top-10",
          className
        )}
        {...props}
      >
        {parts.filter((node) => isSlot(node, SheetHeader))}
        {middle.some((node) => isSlot(node, SheetBody)) ? (
          middle
        ) : (
          <SheetBody>{middle}</SheetBody>
        )}
        {parts.filter((node) => isSlot(node, SheetFooter))}
        {showCloseButton && (
          <SheetPrimitive.Close data-slot="sheet-close" asChild>
            <Button
              variant="ghost"
              className="absolute top-3 end-3"
              size="icon-sm"
            >
              <XIcon
              />
              <span className="sr-only">Close</span>
            </Button>
          </SheetPrimitive.Close>
        )}
      </SheetPrimitive.Content>
    </SheetPortal>
  )
}

function SheetHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sheet-header"
      // pe-12 keeps header content out from under the close button in the corner.
      className={cn("flex flex-col gap-0.5 pe-12", className)}
      {...props}
    />
  )
}

function SheetBody({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sheet-body"
      // Carries the same gap SheetContent used to give these children directly — without
      // it everything in the body stacks flush. min-h-0 is what lets this shrink and
      // scroll instead of pushing the footer off.
      className={cn(
        "flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto",
        className
      )}
      {...props}
    />
  )
}

function SheetFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sheet-footer"
      className={cn("flex flex-col gap-2", className)}
      {...props}
    />
  )
}

function SheetTitle({
  className,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Title>) {
  return (
    <SheetPrimitive.Title
      data-slot="sheet-title"
      className={cn(
        "font-heading text-base font-medium text-foreground",
        className
      )}
      {...props}
    />
  )
}

function SheetDescription({
  className,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Description>) {
  return (
    <SheetPrimitive.Description
      data-slot="sheet-description"
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  )
}

export {
  Sheet,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetBody,
  SheetFooter,
  SheetTitle,
  SheetDescription,
}
