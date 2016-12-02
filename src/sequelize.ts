import { requireDir, processDirectory } from 'willburg/lib/utils';
import { decorators, Willburg, ITask, Configurable } from 'willburg'
import { IModel, IModelList } from './interfaces';
import { QueryFormatter } from './query-formatter'
import * as Debug from 'debug';
import { ResourceFactory } from './resource-factory'
import * as SQ from 'sequelize';

const debug = Debug('willburg:sequelize')
//const DataTypes = require('sequelize/lib/data-types');
const cls = require('continuation-local-storage');

export const DataTypes: SQ.DataTypes = require('sequelize/lib/data-types');


export interface Options extends SQ.Options {
    /**
     * Path to models
     * 
     * @type {string}
     * @memberOf Options
     */
    models?: string;
    /**
     * Path to formatters
     * 
     * @type {string}
     * @memberOf Options
     */
    formatters?: string;
    /**
     * Path to creators
     * 
     * @type {string}
     * @memberOf Options
     */
    creators?: string;

    database?: string;
    username?: string;
    password?: string;
    //creators: string;
    routes?: string;
    // Path to formatters
    
    debug?: boolean;
}


export class SequelizeOptions implements Options {
    
    database: string;
    username: string;
    password: string;
    // Path to models
    models: string;
    creators: string;
    routes: string;
    // Path to formatters
    formatters: string;
    debug: boolean;

    extend(opts: Options) {
        Object.assign(this, opts);
    }
}

@decorators.options(SequelizeOptions)
@decorators.inject(SequelizeOptions, Willburg)
@decorators.service()
export class Sequelize implements Configurable<SequelizeOptions> {
    static DataTypes: SQ.DataTypes = DataTypes;
    seq: SQ.Sequelize;
    private _formatters: { [key: string]: QueryFormatter } = {};
    factories: ResourceFactory<IModel<any>, any>[] = [];
    constructor(public options: SequelizeOptions, public app: Willburg) {
        //super(options.database, options.username, options.password, options);
        let o = options;

        (<any>SQ).cls = cls.createNamespace("willburg:sequelize");

        if (o.debug === true) {
            (<any>o).logging = Debug('willburg:sequelize:sql')
        } else {
            (<any>o).logging = null;
        }

        this.seq = new SQ(o.database, o.username, o.password, o);
    }

    transaction<T>(fn: (t: SQ.Transaction) => Promise<T>): Promise<T> {
        return this.seq.transaction(fn as any) as any;
    }

    define<T, V>(name: string | ((Sequelize, DataTypes) => SQ.Model<T, V>), attr?: { [key: string]: string }): SQ.Model<T, V> {
        if (typeof name === 'function') {
            return (<any>name)(this.seq, DataTypes);
        }
        return this.seq.define<T, V>(<string>name, attr);
    }


    model<T, V>(name: string): SQ.Model<T, V> {
        return this.seq.model<T, V>(name);
    }

    query<T, V>(sql: string | { query: string, values: any[] }, options?: SQ.QueryOptions): Promise<any> {
        return this.seq.query(sql, options) as any;
        
    }

    formatter(name: string): QueryFormatter {
        return this._formatters[name];
    }

    sync (options?: SQ.SyncOptions) {
        return this.seq.sync(options) as any;
    }

    async api<T extends IModel<U>, U>(model: string, fn: (factory: ResourceFactory<T, U>) => void) {
        let factory = new ResourceFactory<T, U>(model);
        
        if (typeof fn === 'function') await fn(factory);
        this.factories.push(factory);
        factory.create(this.app, this);
    }

}

