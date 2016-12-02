"use strict";
const resource_1 = require('./resource');
const willburg_1 = require('willburg');
const Path = require('path');
const compose = require('koa-compose');
(function (Hook) {
    Hook[Hook["ReadAll"] = 0] = "ReadAll";
    Hook[Hook["Read"] = 1] = "Read";
    Hook[Hook["Create"] = 2] = "Create";
    Hook[Hook["Update"] = 3] = "Update";
    Hook[Hook["Delete"] = 4] = "Delete";
})(exports.Hook || (exports.Hook = {}));
var Hook = exports.Hook;
;
function check_id(ctx, next) {
    return next();
}
function resourceRouteFactory(factory, db, options) {
    let controller = options.controller;
    let m = db.model(options.model);
    controller.model = m;
    if (options.formatter) {
        controller.formatter = db.formatter(options.formatter);
    }
    let formatter = factory.desc.formatter;
    if (typeof formatter === 'function') {
    }
    else if (typeof formatter === 'string') {
        formatter = db.formatter(formatter);
    }
    let creator = factory.desc.creator;
    if (creator) {
        controller.creator = db.app.container.get(creator);
    }
    if (formatter)
        controller.formatter = formatter;
    return function (ctx, next) {
        if (ctx.params['id']) {
            if (!/[0-9]+/.test(ctx.params['id'])) {
                delete ctx.params['id'];
                return next();
            }
        }
        if (controller instanceof resource_1.Resource || controller instanceof willburg_1.Controller) {
            /*if (options.middlewares && options.middlewares.length) {
                return compose(options.middlewares.concat([controller[options.action].bind(controller)]))(ctx, next)
            }*/
            return controller.handleRequest(options.action, ctx, next);
        }
        else {
            /*if (factory.desc.middleware) {
                return compose(factory.desc.middleware)(ctx, next).then(() => {
                    return controller[options.action].call(controller, ctx, next);
                });
            } else {
                return controller[options.action].call(controller, ctx, next);
            }*/
            return controller[options.action].call(controller, ctx, next);
        }
    };
}
class ResourceFactory {
    constructor(model) {
        this.desc = {
            middleware: [],
            routes: []
        };
        this.hooks = new Map();
        this.desc.model = model;
    }
    path(path) {
        this.desc.path = path;
        return this;
    }
    model(model) {
        this.desc.model = model;
        return this;
    }
    use(hook, ...fn) {
        if (!this.desc.middleware)
            this.desc.middleware = [];
        if (typeof hook === 'function') {
            let fns = [hook].concat(fn);
            this.desc.middleware.push(...fns);
        }
        else if (fn.length > 0) {
            if (!this.hooks.has(hook))
                this.hooks.set(hook, []);
            this.hooks.get(hook).push(...fn);
        }
        return this;
    }
    creator(creator) {
        this.desc.creator = creator;
        return this;
    }
    controller(controller) {
        this.desc.controller = controller;
        return this;
    }
    getOptions(app, db) {
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
            controller = app.container.get(willburg_1.Willburg);
        }
        else {
            controller = new resource_1.Resource(db);
        }
        if (typeof controller.use === 'function') {
            controller.use(...this.desc.middleware);
        }
        let m = db.model(o.model);
        controller.model = m;
        if (o.formatter) {
            controller.formatter = db.formatter(o.formatter);
        }
        let formatter = this.desc.formatter;
        if (typeof formatter === 'function') {
        }
        else if (typeof formatter === 'string') {
            formatter = db.formatter(formatter);
        }
        let creator = this.desc.creator;
        if (creator) {
            controller.creator = db.app.container.get(creator);
        }
        if (formatter)
            controller.formatter = formatter;
        o.controller = controller;
        return o;
    }
    create(app, db) {
        let path = this.desc.path;
        let o = this.getOptions(app, db);
        let $route = (action, controller, middlewares = []) => {
            var fn;
            return function (ctx, next) {
                if (!fn) {
                    if (controller instanceof resource_1.Resource || controller instanceof willburg_1.Controller) {
                        fn = (ctx, next) => controller.handleRequest(action, ctx, next);
                    }
                    else {
                        fn = compose(middlewares.concat([controller[action].bind(controller)]));
                    }
                }
                return fn(ctx, next);
            };
        };
        //app.router.get(path, resourceRouteFactory(this, db, Object.assign({}, o)));
        //app.router.get(path + "/:id", resourceRouteFactory(this, db, Object.assign({}, o, { action: 'show' })))
        let router = app.router;
        router.get(path, check_id, $route('index', o.controller));
        router.get(path + "/:id", check_id, $route('show', o.controller));
        let routes = this.desc.routes;
        if (routes) {
            let factory = db.app.container.get(willburg_1.Factories.Route);
            for (let i = 0, ii = routes.length; i < ii; i++) {
                router[routes[i].method](Path.join(path, routes[i].path), $route(routes[i].action, o.controller, routes[i].middlewares));
            }
        }
    }
    get(path, action, ...fn) {
        if (!this.desc.routes)
            this.desc.routes = [];
        this.desc.routes.push({ path: path, action: action, method: 'get', middlewares: fn });
        return this;
    }
    post(path, action, ...fn) {
        this.desc.routes.push({ path: path, action: action, method: 'post', middlewares: fn });
        return this;
    }
    options(path, action, ...fn) {
        this.desc.routes.push({ path: path, action: action, method: 'options', middlewares: fn });
        return this;
    }
    format(name) {
        this.desc.formatter = name;
        return this;
    }
}
exports.ResourceFactory = ResourceFactory;
