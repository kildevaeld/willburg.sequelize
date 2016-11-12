"use strict";
const _ = require('lodash');
class QueryFormatter {
    constructor(db, _desc) {
        this.db = db;
        this._desc = _desc;
    }
    get idAttribute() {
        return this._desc.idAttribute || "id";
    }
    get description() { return this._desc; }
    format(model) {
        return this._formatDescription(model, this.description);
    }
    _formatDescription(model, desc) {
        let json = model.toJSON();
        if (desc.include) {
            let includeMap = model["$options"].includeMap;
            let includes = model["$options"].include;
            let getModel = (name) => {
                for (let key in includeMap) {
                    if (includeMap[key].as) {
                        if (includeMap[key].as == name)
                            return {
                                key: key, model: includeMap[key].model
                            };
                    }
                    else if (includeMap[key].model = name) {
                        return { key: key, model: includeMap[key].model };
                    }
                }
            };
            for (let i = 0, ii = includes.length; i < ii; i++) {
                let include = includes[i];
                let name = include.as || include.model;
                let m = getModel(name);
                if (json[m.key]) {
                    if (Array.isArray(json[m.key])) {
                        json[m.key] = model[m.key].map(m => this._formatDescription(m, desc.include[i]));
                    }
                    else {
                        if (desc.include[i] == undefined)
                            continue;
                        json[m.key] = this._formatDescription(model[m.key], desc.include[i]);
                    }
                }
            }
        }
        if (desc.filters) {
            for (let i = 0, ii = desc.filters.length; i < ii; i++) {
                let filterDesc = desc.filters[i];
                if (typeof filterDesc == 'string')
                    filterDesc = [filterDesc];
                let filter = QueryFormatter.filters[filterDesc[0]];
                if (filter == null) {
                    continue;
                }
                json = filter(json, filterDesc.slice(1));
            }
        }
        return json;
    }
    query(o = {}) {
        let query = this._parseDescription(this.description, o);
        return query;
    }
    _parseDescription(desc, o) {
        if (desc.model == "" || desc.model == null) {
            throw new Error("no model");
        }
        let model = this.db.model(desc.model);
        if (model == null) {
            throw new Error('no model with name: ' + desc.model);
        }
        let query = {};
        if (desc.where) {
            query.where = this._parseWhere(desc);
        }
        if (desc.queries) {
            let where = this._parseQueries(desc, o);
            if (query.where && where.length > 0) {
                query.where = {
                    $and: [query.where].concat(where)
                };
            }
            else if (where.length > 0) {
                query.where = where;
            }
        }
        if (desc.columns) {
            query.attributes = this._parseColumns(desc);
        }
        if (desc.include) {
            query.include = this._parseIncludes(desc);
        }
        if (desc.order)
            query.order = desc.order;
        if (desc.limit)
            query.limit = desc.limit;
        if (desc.offset)
            query.offset = desc.offset;
        return query;
    }
    _parseWhere(desc) {
        let where = desc.where;
        if (where.length > 1) {
            where = where.map(m => {
                let c = QueryFormatter.constants[m];
                if (typeof c === 'function') {
                    return c(this.db);
                }
                return c || m;
            });
        }
        return where;
    }
    _parseQueries(desc, o) {
        let queries = desc.queries;
        let model = this.db.model(desc.model);
        let where = [];
        for (let i = 0, ii = queries.length; i < ii; i++) {
            let query = queries[i];
            if (!Array.isArray(query))
                throw new Error('Query is not an error: ' + query);
            if (query.length == 0)
                throw new Error("empty error");
            let name = query[0];
            let q = QueryFormatter.queries[name];
            if (q == null)
                continue; //throw new Error("Query not found " + name);
            let args = query.length > 1 ? query.slice(1) : [];
            let w = q(model, args, o[name]);
            if (w)
                where.push(w);
        }
        return where;
    }
    _parseIncludes(desc) {
        return desc.include.map(i => {
            let m = this._parseDescription(i);
            m['model'] = this.db.model(i.model);
            if (i['as'])
                m['as'] = i['as'];
            return m;
        });
        //return [];
    }
    _parseColumns(desc) {
        let columns = desc.columns;
        if (Array.isArray(columns)) {
            return columns;
        }
        else if (columns["only"]) {
            return columns["only"];
        }
        else if (columns["except"]) {
            let model = this.db.model(desc.model);
            let attr = Object.keys(model.tableAttributes).filter(m => {
                return !!!~columns["except"].indexOf(m);
            });
            return attr;
        }
        else {
            let model = this.db.model(desc.model);
            let attr = Object.keys(model.tableAttributes);
            return attr;
        }
        //return ["*"];
    }
}
QueryFormatter.constants = {};
QueryFormatter.queries = {};
QueryFormatter.filters = {};
exports.QueryFormatter = QueryFormatter;
QueryFormatter.constants["$DATE"] = () => new Date();
QueryFormatter.queries["q"] = function (model, args, o) {
    if (!o)
        return null;
    return args.map(m => {
        return `${m} LIKE '%${o}%'`;
    }).join(" OR ");
};
QueryFormatter.filters["pick"] = function (model, args) {
    if (!model)
        return model;
    let out = {};
    for (let i = 0, ii = args.length; i < ii; i++) {
        if (model.hasOwnProperty(args[i]))
            out[args[i]] = model[args[i]];
    }
    return out;
};
QueryFormatter.filters["pluck"] = function (model, args) {
    if (!model)
        return null;
    if (args.length != 1)
        throw new Error('format:pluck: args length should be 1');
    if (model.hasOwnProperty(args[0])) {
        return model[args[0]];
    }
    return null;
};
QueryFormatter.filters['rename'] = function (model, args) {
    if (!model)
        return model;
    if (args.length == 0)
        throw new Error('format::rename: no args');
    args = args[0];
    for (let key in args) {
        if (model.hasOwnProperty(key)) {
            model[args[key]] = model[key];
            delete model[key];
        }
    }
    return model;
};
QueryFormatter.filters['except'] = function (model, args) {
    if (!model)
        return model;
    if (args == null || args.length === 0)
        throw new Error('format#except: no args');
    for (let i = 0, ii = args.length; i < ii; i++) {
        if (_.has(model, args[i])) {
            delete model[args[i]];
        }
    }
    return model;
};
