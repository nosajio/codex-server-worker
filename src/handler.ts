import { fixUTF8Encoding } from './utils/encoding';
import { getAllPostsFromStore } from './utils/store';
import Router from './utils/router';

export async function handleRequest(event: FetchEvent): Promise<Response> {
  const posts: PostFile[] = await getAllPostsFromStore(codex_store);
  const router = new Router();
  const cache = caches.default;

  router.get('/', req => {
    return new Response(
      'Use /posts/:slug to access individual posts, and /posts to see all posts',
    );
  });

  router.get('/posts', async req => {
    // Check cache for posts response first
    let res = await cache.match(req);
    if (res) {
      return res;
    }
    // When cached version isn't available, serve k/v posts
    res = new Response(fixUTF8Encoding(JSON.stringify(posts)));
    return res;
  });

  router.get('/posts/:slug', async (req, params) => {
    if (!params) {
      return new Response('Need params', { status: 404 });
    }

    // Check Cache for cached response
    let res = await cache.match(req);
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
  });

  const response = await router.handleRoute(event.request);
  response.headers.set('content-type', 'application/json');

  return response;
}
