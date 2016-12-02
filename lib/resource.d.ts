import { Context, Controller } from 'willburg';
import { Sequelize } from './sequelize';
import { IModelList, IModel } from './interfaces';
import { QueryFormatter } from './query-formatter';
import { ICreator } from './creator';
import { Queue } from './queue';
export declare function hasAssociatedQuery(q: any): boolean;
export declare class Resource<T extends IModel<U>, U> extends Controller {
    protected db: Sequelize;
    model: IModelList<T, U>;
    formatter: QueryFormatter;
    creator: ICreator<T, U>;
    private _queue;
    constructor(db: Sequelize);
    readonly queue: Queue<T, U>;
    private _buildPagination(total, ctx);
    index(ctx: Context): Promise<void>;
    show(ctx: Context): Promise<void>;
    create(ctx: Context): void;
    private _getFormatter(ctx);
}
