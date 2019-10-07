import { corsMethods, corsURLs } from './config/cors';
import handleDefaultRoute from './routes/default';
import handlePostRoute from './routes/post';
import handlePostsRoute from './routes/posts';
import Router from './utils/router';
import { getAllPostsFromStore } from './utils/store';

export async function handleRequest(event: FetchEvent): Promise<Response> {
  const posts: PostFile[] = await getAllPostsFromStore(codex_store);
  const router = new Router();
  const origin = event.request.headers.get('Origin');
  const cache = caches.default;

  // Register route handlers
  router.get('/', handleDefaultRoute);
  router.get('/posts', handlePostsRoute(posts, cache));
  router.get('/posts/:slug', handlePostRoute(posts, cache));

  // Run the route handler with the current request, so the appropriate route
  // handler will be triggered
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
    response.headers.set(
      'Access-Control-Allow-Origin',
      `${originURL.protocol}//${foundHost}`,
    );
    response.headers.set(
      'Access-Control-Allow-Methods',
      corsMethods.join(', '),
    );
  }

  return response;
}
