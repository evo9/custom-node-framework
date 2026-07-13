import { ServerResponse } from 'node:http';
import {Request} from './server.js';

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
export type RouteHandler = (req: Request, res: ServerResponse) => void | Promise<void>;


export interface Route {
    path: string;
    method: HttpMethod;
    regex: RegExp;
    params: string[];
    handler: RouteHandler;
}

export interface CurrentRoute {
    handler: RouteHandler;
    params: Record<string, string>;
}

const parameterPattern = '([^/]+)';

export class Router {
    private readonly _routes: Route[] = [];

    public addRoute(path: string, method: HttpMethod, handler: RouteHandler): void {
        const {segments, params} = path.split('/').reduce((acc, segment: string) => {
            let _segment = segment;
            if (segment.startsWith(':')) {
                acc.params.push(segment.replace(':', ''));
                _segment = parameterPattern;
            }
            acc.segments.push(_segment);

            return acc;
        }, {segments: [], params: []} as { segments: string[]; params: string[] });

        this._routes.push({
            regex: new RegExp(`^${segments.join('/')}$`),
            path,
            method,
            params,
            handler,
        });
    }

    public findRoute(url: string, method: HttpMethod): CurrentRoute | null {
        const route = this._routes.find((route: Route) => {
            return route.regex.test(url) && (route.method === method);
        });
        if (!route) return null;

        const matches = route.regex.exec(url);
        if (!matches) return null;

        const params: Record<string, string> = route.params.reduce((acc, param, i) => {
            return {...acc, [param]: matches[i + 1]};
        }, {});

        return {
            handler: route.handler,
            params,
        }
    }
}