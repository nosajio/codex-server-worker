export enum Methods {
  GET = 'GET',
  OPTIONS = 'OPTIONS',
}

type Route = {
  match: RegExp | string;
  method: Methods;
  name: string;
  params?: TokenizedPath;
  handler(req: Request, params?: Params): Promise<Response> | Response;
};

type Params = {
  [name: string]: string;
};

interface RouterI {
  routes: Route[];
  match(pattern: RegExp, method: Methods, request: Request): Boolean;
  handleRoute(req: Request): Promise<Response>;
  get(pattern: RegExp, handler: Route['handler']): void;
}

const paramVarCapture = /(:[a-zA-Z0-9]+)/g;

const createRoute = (
  pattern: Route['match'],
  handler: Route['handler'],
  method: Methods,
): Route => {
  const route: Route = {
    name: String(pattern),
    match: pattern,
    method,
    handler,
  };
  if (typeof pattern === 'string' && paramVarCapture.test(pattern)) {
    const tokens = pathTokenizer(pattern);
    if (!tokens) {
      throw new TypeError(
        `Invalid route pattern: ${pattern}. Couldn't tokenize string`,
      );
    }
    route.params = tokens;
    route.match = tokens[0];
  }
  return route;
};

type TokenizedPath = [RegExp, string[]];

// Converts the path string in to a new regular expression matcher with an array
// of param names that can be merged with the matched param values
const pathTokenizer = (path: string): undefined | TokenizedPath => {
  const paramMatcher = '([a-z-0-9.]*)';
  const pathVars = path.match(paramVarCapture);
  if (!Array.isArray(pathVars) || pathVars.length === 0) {
    return undefined;
  }
  const regExpStr = path.replace(paramVarCapture, paramMatcher);
  return [new RegExp(`^${regExpStr}$`), pathVars];
};

const defaultRouteHandler = (req: Request): Response => {
  return new Response(`No route found for ${req.url}`, { status: 404 });
};

const getParams = (
  [matcher, paramNames]: TokenizedPath,
  url: string,
): undefined | Params => {
  const path = new URL(url).pathname;
  const matches = path.match(matcher);
  if (!matches) {
    return undefined;
  }
  matches.shift();
  const params: Params = matches.reduce(
    (p, v, i) => ({ ...p, [paramNames[i].replace(':', '')]: v }),
    {},
  );
  return params;
};

export default class Router implements RouterI {
  routes: Route[] = [];

  constructor() {}

  async handleRoute(req: Request) {
    const route = this.routes.find(r => this.match(r.match, r.method, req));
    if (!route) {
      return defaultRouteHandler(req);
    }
    // Handle routes with paramaters by matching incoming path with pre-compiled tokens
    let params: Params | undefined = route.params
      ? getParams(route.params, req.url)
      : undefined;
    return await route.handler(req, params);
  }

  get(pattern: Route['match'], handler: Route['handler']) {
    const routeExists = this.routes.some(r => r.name === String(pattern));
    if (routeExists) {
      throw new Error(`${String(pattern)} already exists`);
    }
    this.routes.push(createRoute(pattern, handler, Methods.GET));
  }

  match(pattern: RegExp | string, method: Methods, request: Request) {
    const exp =
      typeof pattern === 'string' ? new RegExp(`^${pattern}$`) : pattern;
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
