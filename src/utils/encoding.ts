export const fixUTF8Encoding = (s: string): string =>
  decodeURIComponent(escape(s));
