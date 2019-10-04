import { getAllPostsFromStore } from './utils/store';
import Router from './utils/router';

export async function handleRequest(event: FetchEvent): Promise<Response> {
  const posts: PostFile[] = await getAllPostsFromStore(codex_store);
  const router = new Router();

  router.get(
    '/',
    () =>
      new Response(
        'Use /posts/:slug to access individual posts, and /posts to see all posts',
      ),
  );

  router.get('/posts', () => {
    return new Response(JSON.stringify(posts));
  });

  router.get('/posts/:slug', (req, params) => {
    if (!params) {
      return new Response('Need params', { status: 404 });
    }
    const { slug } = params;
    const post = posts.find(p => p.slug === slug);
    if (!post) {
      return new Response(`The post ${slug} cannot be found`, { status: 404 });
    }
    return new Response(JSON.stringify(post));
  });

  return router.handleRoute(event.request);
}
