// Copy text to the clipboard. The Clipboard API first; where it is missing or refused (an
// insecure origin, or a frame without clipboard-write, as the preview can be), a hidden
// textarea and execCommand('copy'). Rejects when neither copies.
export async function copyText(text: string): Promise<void> {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text)
      return
    } catch {
      // refused: try the older way below
    }
  }
  if (!copyWithTextarea(text)) throw new Error('Select the prompt and copy it by hand.')
}

function copyWithTextarea(text: string): boolean {
  const ta = document.createElement('textarea')
  ta.value = text
  ta.setAttribute('readonly', '')
  ta.setAttribute('aria-hidden', 'true')
  ta.className = 'ob-copy-buffer'
  const active = document.activeElement as HTMLElement | null
  document.body.appendChild(ta)
  ta.select()
  let copied = false
  try {
    copied = document.execCommand('copy')
  } catch {
    copied = false
  }
  document.body.removeChild(ta)
  active?.focus()
  return copied
}
