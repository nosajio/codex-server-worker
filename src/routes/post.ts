import { CloudflareDefaultCacheStorage } from 'types-cloudflare-worker';
import { fixUTF8Encoding } from './../utils/encoding';
import { Params } from './../utils/router';

const handlePostRoute = (
  posts: PostFile[],
  cache: CloudflareDefaultCacheStorage,
) => async (req: Request, params: Params) => {
  if (!params) {
    return new Response('Need params', { status: 404 });
  }

  let res = await cache.match(req);

  // Check Cache for cached response
  if (res) {
    return res;
  }

  // When cached post isn't available, return k/v stored version
  const { slug } = params;
  const post = posts.find(p => p.slug === slug);

  if (!post) {
    return new Response(`The post ${slug} cannot be found`, { status: 404 });
  }

  res = new Response(fixUTF8Encoding(JSON.stringify(post)));
  return res;
};

export default handlePostRoute;
