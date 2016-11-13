
import { decorators, Context, MiddlewareFunc, IRouter, Controller, Factories } from 'willburg';
import { Sequelize } from './sequelize';
import { IModelList, IModel, Query } from './interfaces'
import { DIContainer } from 'stick.di';
import { QueryFormatter } from './query-formatter';
import { ICreator, ICreatorConstructor } from './creator'
import { Queue } from './queue';

import * as Path from 'path';

const compose = require('koa-compose');

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
}

function resourceRouteFactory<T extends IModel<U>, U>(factory: ResourceFactory<T, U>, db: Sequelize, options: ResourceRouteFactoryOptions) {

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


    let formatter: any = factory.desc.formatter
    if (typeof formatter === 'function') {
        //formatter = (formatter as (ctx: Context) => QueryFormatter)(ctx);
    } else if (typeof formatter === 'string') {
        formatter = db.formatter(formatter);
    }

    let creator = factory.desc.creator;
    if (creator) {
        controller.creator = db.app.container.get(creator);
    }


    if (formatter) controller.formatter = formatter;


    if (controller instanceof Resource) {
        if (factory.desc.middleware) {
            controller.use(...factory.desc.middleware);
        }

        if (options.middlewares && options.middlewares.length > 0) {
            controller.use(...options.middlewares);
        }

        ///return await controller.handleRequest(options.action, ctx, next);
    }


    return function (ctx: Context, next?: Function): Promise<any> {

        /*var controller;
        if (!controller) {
            let Controller = factory.desc.controller || Resource;
            controller = new Controller(db);
        }

        let m = db.model(options.model);
        controller.model = m;

        if (options.formatter) {
            controller.formatter = db.formatter(<string>options.formatter);
        }*/

        if (ctx.params['id']) {
            if (!/[0-9]+/.test(ctx.params['id'])) {
                delete ctx.params['id']
                return next()
            }
        }
        /*
        let creator = factory.desc.creator;
        if (creator) {
            controller.creator = db.app.container.get(creator);
        }


        if (formatter) controller.formatter = formatter;

        */
        if (controller instanceof Resource) {
            /*if (factory.desc.middleware) {
                controller.use(...factory.desc.middleware);
            }

            if (options.middlewares && options.middlewares.length > 0) {
                controller.use(...options.middlewares);
            }*/

            return controller.handleRequest(options.action, ctx, next);
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

export enum Hook {
    ReadAll, Read, Create, Update, Delete
};

export class ResourceFactory<T extends IModel<U>, U> {
    desc: ResourceDescription<T, U> = {};
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

    create(router: IRouter, db: Sequelize) {
        let path = this.desc.path;
        let model = this.desc.model;

        let o = {
            model: model,
            formatter: this.desc.formatter,
            action: 'index',
            middlewares: [],
            creator: this.desc.creator
        };

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

const aFieldReg = /^\$[a-zA-Z.]+\$$/;

function hasAssociatedQuery2(where: any): boolean {
    if (Array.isArray(where)) {
        for (let a of where) {
            if (hasAssociatedQuery2(a)) return true;
        }
    } else {
        if (typeof where === 'string') {
            return aFieldReg.test(where);
        }
        for (let key in where) {
            if (aFieldReg.test(key)) return true;
            if (hasAssociatedQuery2(where[key])) return true;
        }
    }
    return false;
}

export function hasAssociatedQuery(q: any): boolean {
    if (q.limit == null) return false
    if (q == null || q.where == null) return false;
    return hasAssociatedQuery2(q.where)
}

export class Resource<T extends IModel<U>, U> extends Controller {
    model: IModelList<T, U>
    formatter: QueryFormatter
    creator: ICreator<T, U>

    private _queue: Queue<T, U>;

    constructor(protected db: Sequelize) {
        super();
    }

    get queue(): Queue<T, U> {
        if (!this._queue) {
            this._queue = new Queue<T, U>(this.model);
        }
        return this._queue
    }

    private _buildPagination(total: number, ctx: Context): { page: number; pages: number; limit: number; } {
        let page = ctx.query.page ? parseInt(ctx.query.page) : 1;
        if (page <= 0) page = 1;
        let limit = ctx.query.limit ? parseInt(ctx.query.limit) : 100;
        let pages = Math.ceil(total / limit);

        if (page > pages) {
            return { page: page, pages: pages, limit: limit };
        }

        let path = ctx.originalUrl,
            i = path.indexOf('?');
        if (~i) path = path.substr(0, i);

        let url = ctx.protocol + '://' + ctx.request.get('Host') + path + '?page=';

        let links: any = { current: page, first: 1, last: pages };
        if (page != 1) links.prev = page - 1
        if (page != pages) links.next = page + 1

        for (let key in links) {
            links[key] = url + links[key];
        }

        ctx.links(links);

        return { page: page, pages: pages, limit: limit };
    }

    async index(ctx: Context) {

        ctx.type = "json";

        let query = ctx.query
        let q: Query = {};

        let formatter = this._getFormatter(ctx)

        if (formatter) {
            q = formatter.query(query);
        }


        let isPaginated = ctx.query['page'] != null && ctx.query["page"] != "";

        if (isPaginated) {


            let count = 0;
            if (q.include && hasAssociatedQuery(q)) {
                let c = await this.model.findAll({
                    where: q.where,
                    attributes: ["id"],
                    include: q.include
                });
                count = c.length;
            } else {
                count = await this.model.count({
                    where: q.where
                });
            }

            ctx.set("X-Total", count);

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
        }



        let models: IModel<any>[]

        // https://github.com/sequelize/sequelize/issues/6274
        if (hasAssociatedQuery(q)) {

            delete q.limit
            let attr = q.attributes;

            let idAttribute = formatter && formatter.idAttribute ? formatter.idAttribute : 'id'
            q.attributes = [idAttribute]

            let ids = await this.model.findAll(q)
            ids = ids.map(id => id[idAttribute])

            models = await this.queue.findAll(ctx.originalUrl, {
                //offset: offset,
                //limit: ret.limit,
                include: q.include,
                order: q.order,
                attributes: attr,
                where: {
                    [idAttribute]: { $in: ids }
                }
            }, formatter)

        } else {
            models = await this.queue.findAll(ctx.originalUrl, q, formatter);
        }

        ctx.body = models;

    }

    async show(ctx: Context) {
        let query = ctx.query
        let q: Query = {};

        let formatter = this._getFormatter(ctx)

        if (formatter) {
            q = formatter.query(query);
            delete q.where
        }

        let model;
        if (formatter && formatter.idAttribute != "id") {
            q.where = { [formatter.idAttribute]: ctx.params['id'] };


            model = await this.model.findOne(q);

        } else {
            model = await this.model.findById(ctx.params['id'], q)
        }

        ctx.type = "json";
        if (!model) {
            ctx.throw(404);
        }

        if (formatter) {
            ctx.body = formatter.format(model)
        } else {
            ctx.body = model
        }
    }

    create(ctx: Context) {

    }

    private _getFormatter(ctx: Context) {
        if (ctx.state.formatter && ctx.state.formatter instanceof QueryFormatter) {
            return ctx.state.formatter;
        }
        return this.formatter
    }

}