
import { Sequelize, QueryFormatter, IModelList } from 'willburg.sequelize';
import { Model } from 'sequelize';
import { equal, Deferred, deferred } from 'orange';
import { EventEmitter } from 'events';


export enum QueryType {
    One, All
}


export class QueueItem<T, A> extends EventEmitter {
    handlers: Deferred<any>[] = [];
    running: boolean = false;
    constructor(private type: QueryType, private model: Model<T, A>, private q: any, private formatter: QueryFormatter) {
        super();
    }

    add(handler: Deferred<any>) {
        this.handlers.push(handler);
        return this;
    }

    equal(other: QueueItem<T, A>) {
        return equal(this.q, other.q) && equal(this.formatter, other.formatter) && this.type == other.type;
    }

    run() {

        if (this.running) return;

        this.running = true;
        let result;
        if (this.type === QueryType.All) {
            result = this.model.findAll(this.q).then(m => m.map(mm => this.formatter.format(mm)));
        } else {
            result = this.model.find(this.q).then(m => this.formatter.format(m));
        }

        const done = () => {
            this.handlers = [];
            this.running = false;
            this.emit('done');
        }

        result.then(result => {
            for (let deferred of this.handlers) {
                deferred.resolve(result);
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
    constructor(private model: IModelList<T, A>) {

    }

    private remove(item: QueueItem<T, A>) {
        this.queue.splice(this.queue.indexOf(item), 1);

    }

    private add(type: QueryType, q: any, formatter: QueryFormatter) {
        let item = new QueueItem<T, A>(type, this.model, q, formatter);
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
            })
        }

        let promise = deferred();
        item.add(promise);
        return promise.promise;
    }

    findOne(q: any, formatter: QueryFormatter): Promise<any> {
        return this.add(QueryType.One, q, formatter) as Promise<any>;
    }

    findAll(q: any, formatter: QueryFormatter): Promise<any> {
        return this.add(QueryType.All, q, formatter) as Promise<any>;
    }

}