
import {decorators, Context, MiddlewareFunc, IRouter, Controller, Factories} from 'willburg';
import {Sequelize} from './sequelize';
import {IModelList, IModel, Query} from './interfaces'
import {DIContainer} from 'stick.di';
import {QueryFormatter} from './query-formatter';
import * as Path from 'path';

const compose = require('koa-compose');

export interface ResourceDescription {
    model?: string;
    path?: string;
    middleware?: MiddlewareFunc[];
    controller?: any;
    formatter?: string | ((ctx: Context) => QueryFormatter);
    routes?: { path: string; method: string; middlewares: MiddlewareFunc[], action: string; }[]
}

export interface ResourceRouteFactoryOptions {
    model: string;
    action: string;
    formatter?: string | ((ctx: Context) => QueryFormatter);
    middlewares: MiddlewareFunc[]
}

function resourceRouteFactory(factory: ResourceFactory, db: Sequelize, options: ResourceRouteFactoryOptions) {

    return async function (ctx: Context, next?: Function): Promise<any> {
        //debug('calling %s on %s', action, controllerName);
        var controller;
        if (!controller) {
            let Controller = factory.desc.controller || Resource;
            controller = new Controller(db);
        }

        let m = db.model(options.model);
        controller.model = m;

        if (options.formatter) {
            controller.formatter = db.formatter(<string>options.formatter);
        }

        if (ctx.params['id']) {
            if (!/[0-9]+/.test(ctx.params['id'])) {
                delete ctx.params['id']
                return next()
            }
        }

        let formatter: any = factory.desc.formatter
        if (typeof formatter === 'function') {
            formatter = (formatter as (ctx: Context) => QueryFormatter)(ctx);
        } else if (typeof formatter === 'string') {
            formatter = db.formatter(formatter);
        }

        if (formatter) controller.formatter = formatter;

        if (controller instanceof Resource) {
            if (factory.desc.middleware) {
                controller.use(...factory.desc.middleware);
            }

            if (options.middlewares && options.middlewares.length > 0) {
                controller.use(...options.middlewares);
            }

            return await controller.handleRequest(options.action, ctx, next);
        } else {
            if (factory.desc.middleware) {
                return compose(factory.desc.middleware)(ctx, next).then(() => {
                    return controller[options.action].call(controller, ctx, next);
                });
            } else {
                return controller[options.action].call(controller, ctx, next);
            }
        }

    };
}


export class ResourceFactory {
    desc: ResourceDescription = {};

    path(path: string): ResourceFactory {
        this.desc.path = path;
        return this;
    }

    model(model: string): ResourceFactory {
        this.desc.model = model;
        return this;
    }

    use(...fn: MiddlewareFunc[]) {
        if (!this.desc.middleware) this.desc.middleware = [];
        this.desc.middleware.push(...fn);
        return this;
    }

    controller(controller: any) {
        this.desc.controller = controller;
        return this;
    }

    create(router: IRouter, db: Sequelize) {
        let path = this.desc.path;
        let model = this.desc.model;

        let o = { model: model, formatter: this.desc.formatter, action: 'index', middlewares: [] };

        router.get(path, resourceRouteFactory(this, db, Object.assign({}, o)));
        router.get(path + "/:id", resourceRouteFactory(this, db, Object.assign({}, o, { action: 'show' })))

        let routes = this.desc.routes;
        if (routes) {

            let factory = db.app.container.get(Factories.Route)

            for (let i = 0, ii = routes.length; i < ii; i++) {
                o.middlewares = routes[i].middlewares;
                router[routes[i].method](Path.join(path, routes[i].path),
                    resourceRouteFactory(this, db, Object.assign({}, o, { action: routes[i].action })));
            }
        }


    }

    get(path: string, action: string, ...fn: MiddlewareFunc[]) {
        if (!this.desc.routes) this.desc.routes = [];
        this.desc.routes.push({ path: path, action: action, method: 'get', middlewares: fn });
        return this
    }

    format(name: string) {
        this.desc.formatter = name;
        return this;
    }
}

export class Resource<T extends IModel> extends Controller {
    model: IModelList<T>
    formatter: QueryFormatter
    constructor(protected db: Sequelize) {
        super();
    }

    private _buildPagination(total: number, ctx: Context): {page:number; pages:number; limit:number;} {
        let page = ctx.query.page ? parseInt(ctx.query.page) : 1;
        if (page <= 0) page = 1;
        let limit = ctx.query.limit  ? parseInt(ctx.query.limit) : 100;
        let pages = Math.ceil(total / limit);
        
        if (page > pages) {
            return {page: page, pages: pages, limit: limit};
        }

        let path = ctx.originalUrl;
        let i = path.indexOf('?');
        if (~i) path = path.substr(0, i);
        let url = ctx.protocol + '://' + ctx.request.get('Host') + path + '?page=';

        let links: any = { current: page, first: 1, last: pages };
        if (page != 1) links.prev = page - 1
        if (page != pages) links.next = page + 1

        for (let key in links) {
            links[key] = url + links[key];
        }
        ctx.links(links);

        return {page: page, pages: pages, limit: limit};
    }

    async index(ctx: Context) {
        ctx.type = "json";

        let query = ctx.query
        let q: Query = {};

        if (this.formatter) {
            q = this.formatter.query(query);
        }

        let count = 0;
        if (q.include) {
            let c = await this.model.findAll({
                where: q.where,
                attributes: ["id"],
                include: q.include
            });
            count = c.length;
        } else {
            count = await this.model.count(q);
        }

        if (count == 0) {
            ctx.body = [];
            return
        }

        let ret = this._buildPagination(count, ctx);
        if (ret.page > ret.pages) {
            ctx.body = [];
            return;
        }

        let offset = (ret.page - 1) * ret.limit;
        q.offset = offset;
        q.limit = ret.limit;

        let models = await this.model.findAll(q);

        if (this.formatter) {
            ctx.body = models.map(m => this.formatter.format(m))
        } else {
            ctx.body = models
        }

    }

    async show(ctx: Context) {
        let query = ctx.query
        let q: Query;
        if (this.formatter) {
            q = this.formatter.query(query);
            delete q.where
        }

        let model;
        if (this.formatter && this.formatter.idAttribute != "id") {
            q.where = [`${this.formatter.idAttribute} = ?`, ctx.params['id']];
            model = await this.model.findAll(q);
            if (model && model.length == 1) {
                model = model[0];
            } else {
                model = null;
            }
        } else {
            model = await this.model.findById(ctx.params['id'], q)
        }

        ctx.type = "json";
        if (!model) {
            ctx.throw(404);
        }

        if (this.formatter) {
            ctx.body = this.formatter.format(model)
        } else {
            ctx.body = model
        }
    }

    create(ctx: Context) {

    }

}