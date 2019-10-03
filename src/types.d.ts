import { KVNamespace } from '@cloudflare/workers-types';

declare global {
  const codex_store: KVNamespace;
  interface PostFile {
    filename: string;
    contentURI: string;
    body: string;
    slug: string;
    date: Date;
  }
}
