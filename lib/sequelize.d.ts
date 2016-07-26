import { Willburg, Configurable } from 'willburg';
import { IModel, IModelList, Transaction } from './interfaces';
import { QueryFormatter } from './query-formatter';
import { ResourceFactory } from './resource';
export interface QueryOptions {
    replacements?: any[];
    model?: IModelList<IModel>;
    type?: any;
}
export declare class SequelizeOptions {
    database: string;
    username: string;
    password: string;
    models: string;
    routes: string;
    formatters: string;
    debug: boolean;
    set(opts: any): void;
}
export declare class Sequelize implements Configurable<SequelizeOptions> {
    options: SequelizeOptions;
    app: Willburg;
    static DataTypes: any;
    seq: any;
    private _formatters;
    factories: ResourceFactory[];
    constructor(options: SequelizeOptions, app: Willburg);
    transaction<T>(fn: (t: Transaction) => Promise<T>): Promise<T>;
    define<T extends IModel>(name: string, attr: {
        [key: string]: string;
    } | ((Sequelize, DataTypes) => any)): IModelList<T>;
    model<T extends IModel>(name: string): IModelList<T>;
    query<T extends IModel>(sql: string, options?: QueryOptions): Promise<T[]>;
    formatter(name: string): QueryFormatter;
    api(path: string, fn: (factory: ResourceFactory) => void): Promise<void>;
}
