"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments)).next());
    });
};
const willburg_1 = require("willburg");
const query_formatter_1 = require("./query-formatter");
const queue_1 = require("./queue");
const compose = require('koa-compose');
const aFieldReg = /^\$[a-zA-Z.]+\$$/;
function hasAssociatedQuery2(where) {
    if (Array.isArray(where)) {
        for (let a of where) {
            if (hasAssociatedQuery2(a))
                return true;
        }
    }
    else {
        if (typeof where === 'string') {
            return aFieldReg.test(where);
        }
        for (let key in where) {
            if (aFieldReg.test(key))
                return true;
            if (hasAssociatedQuery2(where[key]))
                return true;
        }
    }
    return false;
}
function hasAssociatedQuery(q) {
    if (q.limit == null)
        return false;
    if (q == null || q.where == null)
        return false;
    return hasAssociatedQuery2(q.where);
}
exports.hasAssociatedQuery = hasAssociatedQuery;
class Resource extends willburg_1.Controller {
    constructor(db) {
        super();
        this.db = db;
    }
    get queue() {
        if (!this._queue) {
            this._queue = new queue_1.Queue(this.model);
        }
        return this._queue;
    }
    _buildPagination(total, ctx) {
        let page = ctx.query.page ? parseInt(ctx.query.page) : 1;
        if (page <= 0)
            page = 1;
        let limit = ctx.query.limit ? parseInt(ctx.query.limit) : 100;
        let pages = Math.ceil(total / limit);
        if (page > pages) {
            return { page: page, pages: pages, limit: limit };
        }
        let path = ctx.originalUrl, i = path.indexOf('?');
        if (~i)
            path = path.substr(0, i);
        let url = ctx.protocol + '://' + ctx.request.get('Host') + path + '?page=';
        let links = { current: page, first: 1, last: pages };
        if (page != 1)
            links.prev = page - 1;
        if (page != pages)
            links.next = page + 1;
        for (let key in links) {
            links[key] = url + links[key];
        }
        ctx.links(links);
        return { page: page, pages: pages, limit: limit };
    }
    index(ctx) {
        return __awaiter(this, void 0, void 0, function* () {
            ctx.type = "json";
            let query = ctx.query;
            let q = {};
            let formatter = this._getFormatter(ctx);
            if (formatter) {
                q = formatter.query(query);
            }
            let isPaginated = ctx.query['page'] != null && ctx.query["page"] != "";
            if (isPaginated) {
                let count = 0;
                if (q.include && hasAssociatedQuery(q)) {
                    let c = yield this.model.findAll({
                        where: q.where,
                        attributes: ["id"],
                        include: q.include
                    });
                    count = c.length;
                }
                else {
                    count = yield this.model.count({
                        where: q.where
                    });
                }
                ctx.set("X-Total", count + "");
                if (count == 0) {
                    ctx.body = [];
                    return;
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
            let models;
            // https://github.com/sequelize/sequelize/issues/6274
            if (hasAssociatedQuery(q)) {
                console.log('asso');
                delete q.limit;
                let attr = q.attributes;
                let idAttribute = formatter && formatter.idAttribute ? formatter.idAttribute : 'id';
                q.attributes = [idAttribute];
                let ids = yield this.model.findAll(q);
                ids = ids.map(id => id[idAttribute]);
                models = yield this.queue.findAll(ctx.originalUrl, {
                    //offset: offset,
                    //limit: ret.limit,
                    include: q.include,
                    order: q.order,
                    attributes: attr,
                    where: {
                        [idAttribute]: { $in: ids }
                    }
                }, formatter);
            }
            else {
                models = yield this.queue.findAll(ctx.originalUrl, q, formatter);
            }
            ctx.body = models;
        });
    }
    show(ctx) {
        return __awaiter(this, void 0, void 0, function* () {
            let query = ctx.query;
            let q = {};
            let formatter = this._getFormatter(ctx);
            if (formatter) {
                q = formatter.query(query);
                delete q.where;
            }
            let model;
            if (formatter && formatter.idAttribute != "id") {
                q.where = { [formatter.idAttribute]: ctx.params['id'] };
                model = yield this.model.findOne(q);
            }
            else {
                model = yield this.model.findById(ctx.params['id'], q);
            }
            ctx.type = "json";
            if (!model) {
                ctx.throw(404);
            }
            if (formatter) {
                ctx.body = formatter.format(model);
            }
            else {
                ctx.body = model;
            }
        });
    }
    create(ctx) {
    }
    _getFormatter(ctx) {
        if (ctx.state.formatter && ctx.state.formatter instanceof query_formatter_1.QueryFormatter) {
            return ctx.state.formatter;
        }
        return this.formatter;
    }
}
exports.Resource = Resource;
