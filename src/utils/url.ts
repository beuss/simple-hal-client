export function absolutize(url: string, base?: string): string {
  if (base === undefined || /^[a-z][a-z0-9+.-]*:/i.test(base) === false) {
    base = new URL(base || '', 'https://simple-hal-client.invalid').toString();
  }

  return new URL(url, base)
    .toString()
    .replace('https://simple-hal-client.invalid', '');
}
