import { CloudflareDefaultCacheStorage } from 'types-cloudflare-worker';
import { fixUTF8Encoding } from './../utils/encoding';

const handlePostsRoute = (
  posts: PostFile[],
  cache: CloudflareDefaultCacheStorage,
) => async (req: Request) => {
  let res = await cache.match(req);

  // Check cache for posts response first
  if (res) {
    return res;
  }

  // When cached version isn't available, serve k/v posts
  res = new Response(fixUTF8Encoding(JSON.stringify(posts)));
  return res;
};

export default handlePostsRoute;
