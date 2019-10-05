import { KVNamespace } from '@cloudflare/workers-types';
import CloudflareWorkerGlobalScope from 'types-cloudflare-worker';

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
