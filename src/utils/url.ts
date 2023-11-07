export function absolutize(url: string, base?: string): string {
  return new URL(url, base).toString();
}
