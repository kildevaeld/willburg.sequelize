import { QueryFormatter, IModelList } from 'willburg.sequelize';
import { Model } from 'sequelize';
import { Deferred } from 'orange';
import { EventEmitter } from 'events';
export declare enum QueryType {
    One = 0,
    All = 1,
}
export declare class QueueItem<T, A> extends EventEmitter {
    private type;
    private model;
    private q;
    private formatter;
    handlers: Deferred<any>[];
    running: boolean;
    constructor(type: QueryType, model: Model<T, A>, q: any, formatter: QueryFormatter);
    add(handler: Deferred<any>): this;
    equal(other: QueueItem<T, A>): boolean;
    run(): void;
}
export declare class Queue<T, A> {
    private model;
    queue: QueueItem<T, A>[];
    constructor(model: IModelList<T, A>);
    private remove(item);
    private add(type, q, formatter);
    findOne(q: any, formatter: QueryFormatter): Promise<any>;
    findAll(q: any, formatter: QueryFormatter): Promise<any>;
}
