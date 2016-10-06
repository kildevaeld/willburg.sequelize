import {Sequelize} from './sequelize';
import {Query, IModelList, IModel} from './interfaces';
import {Model, Instance} from 'sequelize';

export interface FormatDescription {
    model: string;
    as?:string;
    queries?: string[][];
    where?: string[];
    order?: string;
    filters: any[];
    columns: string[];
    include: FormatDescription[];
    limit?: number;
    offset?: number;
    idAttribute?: string;
}


export class QueryFormatter {
    static constants: {[key: string]: any} = {};
    static queries: {[key: string]: (model:IModelList<IModel<any>, any>, args:any[], o?) => any} = {};
    static filters: {[key: string]: (model: any, args: any[]) => any} = {};

    get idAttribute(): string {
        return this._desc.idAttribute||"id";
    }
    get description(): FormatDescription { return this._desc; }

    constructor(private db: Sequelize, private _desc: FormatDescription) { }

    public format<T>(model: IModel<T>): any {
        return this._formatDescription(model, this.description);
    }

    public _formatDescription<T>(model: IModel<T>, desc: FormatDescription) {
        let json = model.toJSON();
        if (desc.include) {

            let includeMap = model["$options"].includeMap;
            let includes = model["$options"].include;
            let getModel = (name:string): {key:string;model:string} => {
                for (let key in includeMap) {
                    if (includeMap[key].as) {
                        if (includeMap[key].as == name) return {
                            key: key, model: includeMap[key].model
                        }
                    } else if (includeMap[key].model = name) {
                        return {key: key, model: includeMap[key].model};
                    }
                }
            }

            for (let i = 0, ii = includes.length; i < ii; i++) {
                let include = includes[i];
                let name = include.as||include.model;
                let m = getModel(name);
                if (json[m.key]) {
                    if (Array.isArray(json[m.key])) {
                        json[m.key] = model[m.key].map(m => this._formatDescription(m, desc.include[i]))
                    } else {
                        if (desc.include[i] == undefined) continue;
                        json[m.key] = this._formatDescription(model[m.key], desc.include[i])
                    }
                    
                }
            }
        }

        if (desc.filters) {
            for (let i = 0, ii = desc.filters.length; i < ii; i++) {
                let filterDesc = desc.filters[i]
                if (typeof filterDesc == 'string') filterDesc = [filterDesc]
                let filter = QueryFormatter.filters[filterDesc[0]]
                if (filter == null) {
                    continue;
                    //throw new Error("Could not find filter: " + filterDesc[0]);
                }
                json = filter(json, filterDesc.slice(1))
            }
        }

        return json;
    }


    public query(o = {}): Query {
        let query = this._parseDescription(this.description, o); 
        
        return query;
    }

    private _parseDescription(desc: FormatDescription, o?:any): Query {
        if (desc.model == "" || desc.model == null) {
            throw new Error("no model");
        }

        let model = this.db.model(desc.model);
        if (model == null) {
            throw new Error('no model with name: ' + desc.model);
        }

        let query: Query = {};

        if (desc.where) {
            query.where = this._parseWhere(desc);
        }

        if (desc.queries) {
            let where = this._parseQueries(desc, o)
            if (query.where && where.length > 0) {
                query.where = {
                    $and: [query.where].concat(where)
                }
            } else if (where.length > 0) {
                query.where = where
            }
        }

        if (desc.columns) {
            query.attributes = this._parseColumns(desc);
        }

        if (desc.include) {
            query.include = this._parseIncludes(desc);
        }

        if (desc.order) query.order = desc.order
        if (desc.limit) query.limit = desc.limit;
        if (desc.offset) query.offset = desc.offset;
    
        return query;
    }

    private _parseWhere(desc:FormatDescription): any {
        let where = desc.where
        if (where.length > 1) {
            where = where.map( m => {
                let c = QueryFormatter.constants[m];
                if (typeof c === 'function') {
                    return c(this.db);
                }
                return c||m;
            })
        }
        return where;
    }

    private _parseQueries(desc:FormatDescription, o:any): any {
        let queries = desc.queries;
        
        let model: IModelList<IModel<any>, any> = <any>this.db.model(desc.model);

        let where = [];
        for (let i = 0, ii = queries.length; i < ii; i++) {
            let query = queries[i];
            if (!Array.isArray(query)) throw new Error('Query is not an error: ' + query);
            if (query.length == 0) throw new Error("empty error");

            let name = query[0];
            
            let q = QueryFormatter.queries[name];
            if (q == null) continue; //throw new Error("Query not found " + name);

            let args = query.length > 1 ? query.slice(1) : [];

            let w = q(model, args, o[name]);
            if (w) where.push(w)

        }
        
        return where;
    }

    private _parseIncludes(desc: FormatDescription): Query[] {

        return desc.include.map( i => {
            let m = this._parseDescription(i);
            m['model'] = this.db.model(i.model);
            
            if (i['as']) m['as'] = i['as'];
            return m;
        })
        
        //return [];
    }

    private _parseColumns (desc:FormatDescription): string[] {
        let columns = desc.columns;
        
        if (Array.isArray(columns)) {
            return columns;
        } else if (columns["only"]) {
            return columns["only"];
        } else if (columns["except"]) {
            let model: IModelList<IModel<any>,any> = <any>this.db.model(desc.model)
            let attr = Object.keys(model.tableAttributes).filter( m => {
                return !!!~columns["except"].indexOf(m)
            });

            return attr;
        } else {
            let model: IModelList<IModel<any>,any> = <any>this.db.model(desc.model)
            let attr = Object.keys(model.tableAttributes)
            return attr
        }
        
        //return ["*"];
    }

}

QueryFormatter.constants["$DATE"] = () => new Date()

QueryFormatter.queries["q"] = function (model: IModelList<IModel<any>,any>, args:any[], o?) {
    if (!o) return null;
    
    return args.map(m => {
        return `${m} LIKE '%${o}%'`;
    }).join(" OR ");

}

QueryFormatter.filters["pick"] = function(model: any, args:any[]) {
    if (!model) return model;
    let out = {};
    for (let i = 0, ii = args.length; i < ii; i++) {
        if (model[args[i]]) out[args[i]] = model[args[i]];
    }
    return out;
}

QueryFormatter.filters["pluck"] = function(model: any, args:any[]) {
    if (!model) return null;
    if (args.length != 1) throw new Error('format:pluck: args length should be 1')
    if (model[args[0]]) {
        return model[args[0]]
    }
    return null;
}


QueryFormatter.filters['rename'] = function(model: any, args:any) {
    if (!model) return model;
    if (args.length == 0) throw new Error('format::rename: no args')
    args = args[0]
    for (let key in args) {
        if (model[key]) {
            model[args[key]] = model[key]
            delete model[key];
        }
    }
    return model;
}