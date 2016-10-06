import { requireDir, processDirectory } from 'willburg/lib/utils';
import { decorators, Willburg, ITask, Configurable } from 'willburg'
import { IModel, IModelList } from './interfaces';
import { QueryFormatter } from './query-formatter'
import * as Debug from 'debug';
import { ResourceFactory } from './resource'
import * as SQ from 'sequelize';

const debug = Debug('willburg:sequelize')
//const DataTypes = require('sequelize/lib/data-types');
const cls = require('continuation-local-storage');

export const DataTypes: SQ.DataTypes = require('sequelize/lib/data-types');


export interface Options extends SQ.Options {
    models?: string;
    database?: string;
    username?: string;
    password?: string;
    //creators: string;
    routes?: string;
    // Path to formatters
    formatters?: string;
    debug?: boolean;
}


export class SequelizeOptions implements Options {
    /*dialect: string;
    dialectModulePath: string;
    dialectOptions: Object;
    storage: string;
    host: string;
    port: number;
    protocol: string;
    define: SQ.DefineOptions<any>;
    query: SQ.QueryOptions;
    set: SQ.SetOptions;
    sync: SQ.SyncOptions;
    timezone: string;
    logging: boolean | Function;
    omitNull: boolean;
    native: boolean;
    replication: SQ.ReplicationOptions;
    pool: SQ.PoolOptions;
    quoteIdentifiers: boolean;
    isolationLevel: string;
    transactionType: string;*/

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
        return this.seq.transaction(fn);
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
        return this.seq.query(sql, options);
    }

    formatter(name: string): QueryFormatter {
        return this._formatters[name];
    }

    sync (options?: SQ.SyncOptions) {
        return this.seq.sync(options)
    }

    async api<T extends IModel<U>, U>(model: string, fn: (factory: ResourceFactory<T, U>) => void) {
        let factory = new ResourceFactory<T, U>(model);
        
        if (typeof fn === 'function') await fn(factory);
        this.factories.push(factory);
        factory.create(this.app.router, this);
    }

}

