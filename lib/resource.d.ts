import { Context, MiddlewareFunc, IRouter, Controller } from 'willburg';
import { Sequelize } from './sequelize';
import { IModelList, IModel } from './interfaces';
import { QueryFormatter } from './query-formatter';
export interface ResourceDescription {
    model?: string;
    path?: string;
    middleware?: MiddlewareFunc[];
    controller?: any;
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
}
export declare enum Hook {
    ReadAll = 0,
    Read = 1,
    Create = 2,
    Update = 3,
    Delete = 4,
}
export declare class ResourceFactory {
    desc: ResourceDescription;
    hooks: Map<Hook, MiddlewareFunc[]>;
    path(path: string): ResourceFactory;
    model(model: string): ResourceFactory;
    use(hook: Hook | MiddlewareFunc, ...fn: MiddlewareFunc[]): this;
    controller(controller: any): this;
    create(router: IRouter, db: Sequelize): void;
    get(path: string, action: string, ...fn: MiddlewareFunc[]): this;
    format(name: string): this;
}
export declare function hasAssociatedQuery(q: any): boolean;
export declare class Resource<T extends IModel> extends Controller {
    protected db: Sequelize;
    model: IModelList<T>;
    formatter: QueryFormatter;
    constructor(db: Sequelize);
    private _buildPagination(total, ctx);
    index(ctx: Context): Promise<void>;
    show(ctx: Context): Promise<void>;
    create(ctx: Context): void;
}
