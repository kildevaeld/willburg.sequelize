import { Context, MiddlewareFunc, IRouter, Controller } from 'willburg';
import { Sequelize } from './sequelize';
import { IModelList, IModel } from './interfaces';
import { QueryFormatter } from './query-formatter';
import { ICreator, ICreatorConstructor } from './creator';
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
}
export declare enum Hook {
    ReadAll = 0,
    Read = 1,
    Create = 2,
    Update = 3,
    Delete = 4,
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
    create(router: IRouter, db: Sequelize): void;
    get(path: string, action: string, ...fn: MiddlewareFunc[]): this;
    format(name: string): this;
}
export declare function hasAssociatedQuery(q: any): boolean;
export declare class Resource<T extends IModel<U>, U> extends Controller {
    protected db: Sequelize;
    model: IModelList<T, U>;
    formatter: QueryFormatter;
    creator: ICreator<T, U>;
    constructor(db: Sequelize);
    private _buildPagination(total, ctx);
    index(ctx: Context): Promise<void>;
    show(ctx: Context): Promise<void>;
    create(ctx: Context): void;
    private _getFormatter(ctx);
}
