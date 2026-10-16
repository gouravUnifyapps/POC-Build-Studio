import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps } from "sonner"
import { CircleCheckIcon, InfoIcon, TriangleAlertIcon, OctagonXIcon, Loader2Icon } from "lucide-react"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      // Every toast gets an X, so one that overstays — a long error, or one the app
      // keeps re-firing — can be dismissed instead of sitting there. The only other
      // way out is a swipe nobody discovers.
      closeButton
      icons={{
        success: (
          <CircleCheckIcon className="size-4" />
        ),
        info: (
          <InfoIcon className="size-4" />
        ),
        warning: (
          <TriangleAlertIcon className="size-4" />
        ),
        error: (
          <OctagonXIcon className="size-4" />
        ),
        loading: (
          <Loader2Icon className="size-4 animate-spin" />
        ),
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "var(--radius)",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast: "cn-toast",
          // Each state takes its own status tokens, so a success toast is not the
          // same grey as an error one. Three things make these look the way they do:
          //
          // `!` because sonner paints the toast from
          // `[data-sonner-toast][data-styled='true']`, which outranks a plain utility.
          //
          // The fallback inside each var() because `background-color: var(--undefined)`
          // computes to TRANSPARENT rather than falling through to the rule below, so a
          // missing token would mean see-through toasts rather than plain ones. It is a
          // guard, not the normal path: `src/index.css` ships all four status families,
          // so these resolve to the design system's green/amber/red/blue whether or not
          // the app follows a platform brand theme. They used to be defined ONLY for an
          // app whose owner had pinned a theme, which is almost none of them — so the
          // fallback WAS the normal path and every success and error toast came out the
          // same white card.
          //
          // Written as arbitrary values rather than `bg-success-subtle!` only because
          // a utility cannot express that fallback.
          //
          // The BORDER is deliberately left to sonner. It declares `--success-border` /
          // `--warning-border` / `--info-border` itself on `[data-sonner-toaster]`, an
          // ANCESTOR of every toast, so inside a toast those three names resolve to
          // SONNER's hardcoded colour and neither our token nor the fallback is ever
          // reached — which painted dark green/olive/navy borders on an otherwise
          // untouched app. (`destructive` escapes only because sonner spells that one
          // `--error-border`.) Setting them is not an option either: the names collide
          // with ours, and a self-referential custom property is invalid. The state
          // reads clearly from its surface and ink.
          success:
            "bg-[var(--success-subtle,var(--normal-bg))]! text-[var(--success-subtle-foreground,var(--normal-text))]!",
          warning:
            "bg-[var(--warning-subtle,var(--normal-bg))]! text-[var(--warning-subtle-foreground,var(--normal-text))]!",
          error:
            "bg-[var(--destructive-subtle,var(--normal-bg))]! text-[var(--destructive-subtle-foreground,var(--normal-text))]!",
          info:
            "bg-[var(--info-subtle,var(--normal-bg))]! text-[var(--info-subtle-foreground,var(--normal-text))]!",
          // The X takes the toast's own colours so it reads on every state. Sonner
          // paints it from its own greys, which land as a white button on a
          // coloured toast once a theme is pinned.
          closeButton:
            "bg-inherit! text-current! border-current/25! hover:border-current/50!",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
