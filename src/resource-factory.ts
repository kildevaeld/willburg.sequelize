
import { Resource } from './resource';
import { IModel } from './interfaces';
import { QueryFormatter } from './query-formatter';
import { ICreatorConstructor } from './creator';
import { Context, MiddlewareFunc, IRouter, Factories, Willburg, Controller } from 'willburg';
import { Sequelize } from './sequelize';
import * as Path from 'path';

const compose = require('koa-compose');

export enum Hook {
    ReadAll, Read, Create, Update, Delete
};

export interface ResourceDescription<T extends IModel<U>, U> {
    model?: string;
    path?: string;
    middleware?: MiddlewareFunc[];
    controller?: any;
    creator?: ICreatorConstructor<T, U>
    formatter?: string | ((ctx: Context) => QueryFormatter);
    routes?: { path: string; method: string; middlewares: MiddlewareFunc[], action: string; }[]
}

export interface ResourceRouteFactoryOptions {
    model: string;
    action: string;
    formatter?: string | ((ctx: Context) => QueryFormatter);
    middlewares: MiddlewareFunc[]
    controller: any;
}


export class ResourceFactory<T extends IModel<U>, U> {
    desc: ResourceDescription<T, U> = {
        middleware: [],
        routes: []
    };
    hooks: Map<Hook, MiddlewareFunc[]> = new Map();

    constructor(model: string) {
        this.desc.model = model;
    }

    path(path: string): ResourceFactory<T, U> {
        this.desc.path = path;
        return this;
    }

    model(model: string): ResourceFactory<T, U> {
        this.desc.model = model;
        return this;
    }

    use(hook: Hook | MiddlewareFunc, ...fn: MiddlewareFunc[]) {
        if (!this.desc.middleware) this.desc.middleware = [];
        if (typeof hook === 'function') {
            let fns = [(<any>hook)].concat(fn);
            this.desc.middleware.push(...fns);
        } else if (fn.length > 0) {
            if (!this.hooks.has(hook)) this.hooks.set(hook, []);
            this.hooks.get(hook).push(...fn);
        }

        return this;
    }

    creator(creator: ICreatorConstructor<T, U>) {
        this.desc.creator = creator;
        return this;
    }

    controller(controller: any) {
        this.desc.controller = controller;
        return this;
    }


    private getOptions(app: Willburg, db: Sequelize) {
        let o = {
            model: this.desc.model,
            formatter: this.desc.formatter,
            action: 'index',
            middlewares: [],
            creator: this.desc.creator,
            controller: null
        };

        let controller;
        if (this.desc.controller) {
            controller = app.container.get(this.desc.controller);
        } else {
            controller = new Resource<T, U>(db)
        }


        if (typeof controller.use === 'function') {
            controller.use(...this.desc.middleware)
        }

        let m = db.model(o.model);
        controller.model = m;

        if (o.formatter) {
            controller.formatter = db.formatter(<string>o.formatter);
        }


        let formatter: any = this.desc.formatter
        if (typeof formatter === 'function') {
            //formatter = (formatter as (ctx: Context) => QueryFormatter)(ctx);
        } else if (typeof formatter === 'string') {
            formatter = db.formatter(formatter);
        }

        let creator = this.desc.creator;
        if (creator) {
            controller.creator = db.app.container.get(creator);
        }


        if (formatter) controller.formatter = formatter;

        o.controller = controller;

        return o;
    }

    create(app: Willburg, db: Sequelize) {
        let path = this.desc.path;


        let o = this.getOptions(app, db);

        let $route = (action: string, controller: any, middlewares: MiddlewareFunc[] = []): MiddlewareFunc => {
            var fn: MiddlewareFunc;
            return function(ctx: Context, next: () => Promise<any>) {


                if (ctx.params['id']) {
                    if (!/[0-9]+/.test(ctx.params['id'])) {
                        delete ctx.params['id']
                        return next()
                    }
                }

                if (!fn) {
                    if (controller instanceof Resource || controller instanceof Controller) {
                        fn = (ctx, next) => controller.handleRequest(action, ctx, next);

                    } else {
                        fn = compose(middlewares.concat([controller[action].bind(controller)]));
                    }
                }

                return fn(ctx, next);
            }
        }


        
        let router = app.router;

        router.get(path, $route('index', o.controller));
        router.get(path + "/:id", $route('show', o.controller))


        let routes = this.desc.routes;
        if (routes) {

            let factory = db.app.container.get(Factories.Route)

            for (let i = 0, ii = routes.length; i < ii; i++) {

                router[routes[i].method](Path.join(path, routes[i].path), $route(routes[i].action, o.controller, routes[i].middlewares));
            }
        }


    }

    get(path: string, action: string, ...fn: MiddlewareFunc[]) {
        if (!this.desc.routes) this.desc.routes = [];
        this.desc.routes.push({ path: path, action: action, method: 'get', middlewares: fn });
        return this
    }

    post(path: string, action: string, ...fn: MiddlewareFunc[]) {
        this.desc.routes.push({ path: path, action: action, method: 'post', middlewares: fn });
        return this
    }

    options(path: string, action: string, ...fn: MiddlewareFunc[]) {
        this.desc.routes.push({ path: path, action: action, method: 'options', middlewares: fn });
        return this
    }

    format(name: string) {
        this.desc.formatter = name;
        return this;
    }
}