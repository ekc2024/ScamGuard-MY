/**
 * Copies text to the clipboard. Clipboard writes reject when the API is
 * unavailable (non-secure context, denied permission), so failures are logged
 * and reported back instead of surfacing as an unhandled rejection while the
 * UI still shows "Copied!".
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (!navigator.clipboard?.writeText) {
      throw new Error("Clipboard API unavailable in this browser context");
    }
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error("Failed to copy to clipboard:", error);
    return false;
  }
}
