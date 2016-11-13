import { Model } from 'sequelize';
import { Deferred } from 'orange';
import { EventEmitter } from 'events';
import { QueryFormatter } from './query-formatter';
export declare enum QueryType {
    One = 0,
    All = 1,
}
export declare class QueueItem<T, A> extends EventEmitter {
    id: string;
    private type;
    private model;
    private q;
    private formatter;
    handlers: Deferred<any>[];
    running: boolean;
    constructor(id: string, type: QueryType, model: Model<T, A>, q: any, formatter: QueryFormatter);
    add(handler: Deferred<any>): this;
    equal(other: QueueItem<T, A>): boolean;
    run(): void;
}
export declare class Queue<T, A> {
    private model;
    queue: QueueItem<T, A>[];
    constructor(model: Model<T, A>);
    private remove(item);
    private add(key, type, q, formatter);
    findOne(key: string, q: any, formatter: QueryFormatter): Promise<any>;
    findAll(key: string, q: any, formatter: QueryFormatter): Promise<any>;
}
