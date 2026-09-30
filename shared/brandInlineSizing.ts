/** Lowercase wordmark height — match x-height of companion text at `fontSize`. */
export function wordmarkHeightForFontSize(fontSize: number): number {
  return Math.round(fontSize * 0.56);
}
