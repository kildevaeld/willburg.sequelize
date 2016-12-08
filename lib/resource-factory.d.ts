import { IModel } from './interfaces';
import { QueryFormatter } from './query-formatter';
import { ICreatorConstructor } from './creator';
import { Context, MiddlewareFunc, Willburg } from 'willburg';
import { Sequelize } from './sequelize';
export declare enum Hook {
    ReadAll = 0,
    Read = 1,
    Create = 2,
    Update = 3,
    Delete = 4,
}
export interface ResourceDescription<T extends IModel<U>, U> {
    model?: string;
    path?: string;
    middleware?: MiddlewareFunc[];
    controller?: any;
    creator?: ICreatorConstructor<T, U>;
    formatter?: string | ((ctx: Context) => QueryFormatter);
    routes?: {
        path: string;
        method: string;
        middlewares: MiddlewareFunc[];
        action: string;
    }[];
}
export interface ResourceRouteFactoryOptions {
    model: string;
    action: string;
    formatter?: string | ((ctx: Context) => QueryFormatter);
    middlewares: MiddlewareFunc[];
    controller: any;
}
export declare class ResourceFactory<T extends IModel<U>, U> {
    desc: ResourceDescription<T, U>;
    hooks: Map<Hook, MiddlewareFunc[]>;
    constructor(model: string);
    path(path: string): ResourceFactory<T, U>;
    model(model: string): ResourceFactory<T, U>;
    use(hook: Hook | MiddlewareFunc, ...fn: MiddlewareFunc[]): this;
    creator(creator: ICreatorConstructor<T, U>): this;
    controller(controller: any): this;
    private getOptions(app, db);
    create(app: Willburg, db: Sequelize): void;
    get(path: string, action: string, ...fn: MiddlewareFunc[]): this;
    post(path: string, action: string, ...fn: MiddlewareFunc[]): this;
    options(path: string, action: string, ...fn: MiddlewareFunc[]): this;
    format(name: string): this;
}
