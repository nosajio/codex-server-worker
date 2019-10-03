export enum Methods {
  GET = 'GET',
  OPTIONS = 'OPTIONS',
}

type Route = {
  match: RegExp | string;
  method: Methods;
  handler(req: Request, params?: Params): Promise<Response> | Response;
};

type Params = {
  [name: string]: string;
};

interface RouterI {
  routes: Route[];
  match(pattern: RegExp, method: Methods, request: Request): Boolean;
  handleRoute(req: Request): Response | Promise<Response>;
  get(pattern: RegExp, handler: Route['handler']): void;
}

const createRoute = (
  pattern: Route['match'],
  handler: Route['handler'],
  method: Methods,
): Route => {
  return {
    match: pattern,
    method,
    handler,
  };
};

const defaultRouteHandler = (req: Request): Response => {
  return new Response(`No route found for ${req.url}`, { status: 404 });
};

export default class Router implements RouterI {
  routes: Route[] = [];

  constructor() {}

  async handleRoute(req: Request) {
    const findRoute = this.routes.find(r => this.match(r.match, r.method, req));
    if (!findRoute) {
      return defaultRouteHandler(req);
    }
    return findRoute.handler(req);
  }

  async get(pattern: Route['match'], handler: Route['handler']) {
    const routeExists = this.routes.some(r => r.match === pattern);
    if (routeExists) {
      throw new Error(`${String(pattern)} already exists`);
    }
    this.routes.push(createRoute(pattern, handler, Methods.GET));
  }

  match(pattern: RegExp | string, method: Methods, request: Request) {
    const exp = typeof pattern === 'string' ? new RegExp(`^${pattern}$`) : pattern;
    const requestUrl = new URL(request.url);
    const requestPath = requestUrl.pathname;
    const requestMethod = request.method;
    if (
      requestMethod.toLowerCase() !== method.toLowerCase() ||
      !exp.test(requestPath)
    ) {
      return false;
    }
    return true;
  }
}
