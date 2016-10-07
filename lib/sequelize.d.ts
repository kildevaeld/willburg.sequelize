import { Willburg, Configurable } from 'willburg';
import { IModel } from './interfaces';
import { QueryFormatter } from './query-formatter';
import { ResourceFactory } from './resource';
import * as SQ from 'sequelize';
export declare const DataTypes: SQ.DataTypes;
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
    routes?: string;
    debug?: boolean;
}
export declare class SequelizeOptions implements Options {
    database: string;
    username: string;
    password: string;
    models: string;
    creators: string;
    routes: string;
    formatters: string;
    debug: boolean;
    extend(opts: Options): void;
}
export declare class Sequelize implements Configurable<SequelizeOptions> {
    options: SequelizeOptions;
    app: Willburg;
    static DataTypes: SQ.DataTypes;
    seq: SQ.Sequelize;
    private _formatters;
    factories: ResourceFactory<IModel<any>, any>[];
    constructor(options: SequelizeOptions, app: Willburg);
    transaction<T>(fn: (t: SQ.Transaction) => Promise<T>): Promise<T>;
    define<T, V>(name: string | ((Sequelize, DataTypes) => SQ.Model<T, V>), attr?: {
        [key: string]: string;
    }): SQ.Model<T, V>;
    model<T, V>(name: string): SQ.Model<T, V>;
    query<T, V>(sql: string | {
        query: string;
        values: any[];
    }, options?: SQ.QueryOptions): Promise<any>;
    formatter(name: string): QueryFormatter;
    sync(options?: SQ.SyncOptions): Promise<any>;
    api<T extends IModel<U>, U>(model: string, fn: (factory: ResourceFactory<T, U>) => void): Promise<void>;
}
