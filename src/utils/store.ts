import { KVNamespace } from '@cloudflare/workers-types';

export async function getAllPostsFromStore(
  store: KVNamespace,
): Promise<PostFile[]> {
  if (!store) {
    throw new TypeError('Store argument required to clear operation');
  }
  try {
    const keys = (await store.list({})).keys.map(k => k.name);
    const posts: PostFile[] = (await Promise.all(
      keys.map(k =>
        store.get(k).then(str => (str ? JSON.parse(str) : undefined)),
      ),
    )).filter(Boolean);
    return posts;
  } catch (err) {
    throw err;
  }
}

export async function getFromStore(
  store: KVNamespace,
  key: string,
  defaultValue?: string,
): Promise<string | undefined> {
  const value = await store.get(key);
  if (!value) {
    return defaultValue || undefined;
  }
  return value;
}
