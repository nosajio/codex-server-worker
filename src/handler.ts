import { fixUTF8Encoding } from './utils/encoding';
import { getAllPostsFromStore } from './utils/store';
import Router from './utils/router';
import { corsURLs, corsMethods } from './config/cors';

export async function handleRequest(event: FetchEvent): Promise<Response> {
  const posts: PostFile[] = await getAllPostsFromStore(codex_store);
  const router = new Router();
  const cache = caches.default;
  const origin = event.request.headers.get('Origin');

  router.get('/', req => {
    return new Response(
      'Use /posts/:slug to access individual posts, and /posts to see all posts',
    );
  });

  router.get('/posts', async req => {
    let res = await cache.match(req);

    // Check cache for posts response first
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
  });

  const response = await router.handleRoute(event.request);

  // Set content type header so that clients don't confuse the response with
  // plain text
  response.headers.set('content-type', 'application/json');

  // Handle cors headers for all requests that aren't preflight (OPTIONS)
  // requests
  if (origin && event.request.method !== 'OPTIONS') {
    const originURL = new URL(origin);
    const foundHost = corsURLs.find(c => c === originURL.host);
    if (!foundHost) {
      return response;
    }
    response.headers.set('Access-Control-Allow-Origin', `${originURL.protocol}//${foundHost}`);
    response.headers.set(
      'Access-Control-Allow-Methods',
      corsMethods.join(', '),
    );
  }

  return response;
}
