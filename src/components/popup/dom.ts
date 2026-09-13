/**
 * The one piece of real DOM interaction left anywhere in the tree/popup: a
 * left-click with no modifier keys is the kind we can safely `preventDefault`
 * on ourselves (anything else — ctrl/cmd/shift/alt/middle-click — is left
 * alone so "open in new tab" etc. keeps working on our real `<a href>`s).
 */
export function isPlainClick(e: MouseEvent): boolean {
  return e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey;
}
