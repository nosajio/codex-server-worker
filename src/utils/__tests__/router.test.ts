import 'jest-fetch-mock';
import Router, { Methods } from '../router';

describe('Router', () => {
  let r: Router;

  test("doesn't error on init", () => {
    r = new Router();
    expect(r).toBeInstanceOf(Router);
  });

  test('can add GET route handler', () => {
    const routeName = '/one';
    r.get(routeName, () => {
      return new Response();
    });
    const routeExists = r.routes.some(rr => rr.match === routeName);
    expect(routeExists).toBeTruthy();
  });

  test('return 404 when no routes are matched', async () => {
    expect.assertions(2);
    r.get('/should-404', () => new Response("didn't 404", { status: 200 }));
    const res = await r.handleRoute(
      new Request('http://example.com/found', { method: 'GET' }),
    );
    expect(res.status).toBe(404);
    expect(res.body).toBe('No route found for http://example.com/found');
  });

  test('match() will match strings', () => {
    expect.assertions(3);
    expect(
      r.match(
        '/o',
        Methods.GET,
        new Request('http://example.com/a', { method: 'GET' }),
      ),
    ).toBeFalsy();
    expect(
      r.match(
        '/a/b/c',
        Methods.GET,
        new Request('http://example.com/a/b/c', { method: 'GET' }),
      ),
    ).toBeTruthy();
    expect(
      r.match(
        '/test',
        Methods.GET,
        new Request('http://example.com/test', { method: 'GET' }),
      ),
    ).toBeTruthy();
  });

  test('match() will match RegExp', () => {
    expect(
      r.match(
        /\/test/,
        Methods.GET,
        new Request('http://example.com/test', { method: 'GET' }),
      ),
    ).toBeTruthy();
  });

  test('can respond to a GET request', async () => {
    const routeName = '/hello-world';
    r.get(routeName, () => {
      return new Response('It works');
    });
    const res = await r.handleRoute(
      new Request('http://example.com/hello-world', { method: 'GET' }),
    );
    expect(res.body).toBe('It works');
  });

  test('throw when attempting to create two routes with the same match pattern', () => {
    const router = new Router();
    router.get('/same', () => new Response());
    expect(() => router.get('/same', () => new Response())).toThrow();
  });

  test('can create multiple routes', async () => {
    const router = new Router();
    const routes = ['/one', '/two', '/three'];
    const routeHandler = (name: string) => (req: Request) => new Response(name);
    routes.forEach(route => router.get(route, routeHandler(route)));
    expect(router.routes.map(r => r.match)).toEqual(
      expect.arrayContaining(routes),
    );
  });

  test('can match root route (/)', async () => {
    expect.assertions(2);
    r.get('/', () => new Response('hi'));
    const res1 = await r.handleRoute(
      new Request('http://example.com', { method: 'get' }),
    );
    const res2 = await r.handleRoute(
      new Request('http://example.com/', { method: 'get' }),
    );
    expect(res1.body).toBe('hi');
    expect(res2.body).toBe('hi');
  });

  test('can match variable params and return values', async () => {
    r.get(
      '/post/:postName',
      (req, params) => new Response((params || {}).postName),
    );
    const res = await r.handleRoute(
      new Request('http://example.com/post/hello-there', { method: 'get' }),
    );
    expect(res.body).toBe('hello-there');
  });
});
