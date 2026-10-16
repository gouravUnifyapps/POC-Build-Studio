import { clsx, type ClassValue } from "clsx"
import { extendTailwindMerge } from "tailwind-merge"

// The theme's own text sizes. Without them twMerge takes these for colours: it drops
// the element's real text colour and leaves a primitive's size fighting the caller's.
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [
        { text: ["xsm", "xxs", "xxxs", "para-md", "para-sm", "para-xs", "code-xs", "code-xxs", "code-xxxs"] },
      ],
    },
  },
})

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// a size class nobody writes, used only to ask twMerge whether the classes set one
const SIZE_PROBE = "text-[length:var(--size-probe)]"

// true when the classes already set a text size, like "text-sm" or "text-code-xs"
export function hasTextSize(className?: string) {
  return !twMerge(SIZE_PROBE, className).split(" ").includes(SIZE_PROBE)
}
