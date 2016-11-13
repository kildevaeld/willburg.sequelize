
import { Model } from 'sequelize';
import { equal, Deferred, deferred, extend } from 'orange';
import { EventEmitter } from 'events';
import { Sequelize } from './sequelize';
import { QueryFormatter } from './query-formatter';

export enum QueryType {
    One, All
}

export class QueueItem<T, A> extends EventEmitter {
    handlers: Deferred<any>[] = [];
    running: boolean = false;
    constructor(public id: string, private type: QueryType, private model: Model<T, A>, private q: any, private formatter: QueryFormatter) {
        super();
    }

    add(handler: Deferred<any>) {
        this.handlers.push(handler);
        return this;
    }

    equal(other: QueueItem<T, A>) {
        return this.id === other.id && equal(this.formatter, other.formatter) && this.type == other.type;
    }

    run() {

        if (this.running) return;

        this.running = true;
        let result;
        if (this.type === QueryType.All) {
            let q = extend({}, this.q || {});
            if (q.include && (q.offset != null || q.limit != null)) {
                result = this.model.findAll({
                    attributes: ['id'],
                    where: q.where,
                    limit: q.limit,
                    offset: q.offset
                }).then(ids => {
                    delete q.offset;
                    delete q.limit;
                    q.where = { id: ids.map(m => (<any>m).id) };
                    return this.model.findAll(q)
                })
            } else {
                result = this.model.findAll(this.q).then(m => m.map(mm => this.formatter.format(mm)));
            }

        } else {
            result = this.model.find(this.q).then(m => this.formatter.format(m));
        }

        const done = () => {
            this.handlers = [];
            this.running = false;
            this.emit('done');
        }

        result.then(result => {
            /*for (let deferred of this.handlers) {
                deferred.resolve(result);
            }*/
            for (let i = this.handlers.length - 1, ii = 0; i >= ii; i--) {
                this.handlers[i].resolve(result);
            }
            done();
        }).catch(e => {
            for (let deferred of this.handlers) {
                deferred.reject(e);
            }
            done();
        });
    }

}

export class Queue<T, A> {
    queue: QueueItem<T, A>[] = [];
    constructor(private model: Model<T, A>) {

    }

    private remove(item: QueueItem<T, A>) {
        this.queue.splice(this.queue.indexOf(item), 1);

    }

    private add(key: string, type: QueryType, q: any, formatter: QueryFormatter) {
        let item = new QueueItem<T, A>(key, type, this.model, q, formatter);
        let found = false;

        for (let i of this.queue) {
            if (i.equal(item)) {
                item = i;
                found = true;
                break;
            }
        }

        if (!found) {
            this.queue.push(item);
            item.on('done', () => {
                this.remove(item);
            });
            item.run();
        }

        let promise = deferred();
        item.add(promise);
        return promise.promise;
    }

    findOne(key: string, q: any, formatter: QueryFormatter): Promise<any> {
        return this.add(key, QueryType.One, q, formatter) as Promise<any>;
    }

    findAll(key: string, q: any, formatter: QueryFormatter): Promise<any> {
        return this.add(key, QueryType.All, q, formatter) as Promise<any>;
    }

}