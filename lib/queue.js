"use strict";
const orange_1 = require('orange');
const events_1 = require('events');
(function (QueryType) {
    QueryType[QueryType["One"] = 0] = "One";
    QueryType[QueryType["All"] = 1] = "All";
})(exports.QueryType || (exports.QueryType = {}));
var QueryType = exports.QueryType;
class QueueItem extends events_1.EventEmitter {
    constructor(id, type, model, q, formatter) {
        super();
        this.id = id;
        this.type = type;
        this.model = model;
        this.q = q;
        this.formatter = formatter;
        this.handlers = [];
        this.running = false;
    }
    add(handler) {
        this.handlers.push(handler);
        return this;
    }
    equal(other) {
        return this.id === other.id && orange_1.equal(this.formatter, other.formatter) && this.type == other.type;
    }
    run() {
        if (this.running)
            return;
        this.running = true;
        let result;
        if (this.type === QueryType.All) {
            let q = orange_1.extend({}, this.q || {});
            if (q.include && (q.offset != null || q.limit != null)) {
                result = this.model.findAll({
                    attributes: ['id'],
                    where: q.where,
                    limit: q.limit,
                    offset: q.offset
                }).then(ids => {
                    delete q.offset;
                    delete q.limit;
                    q.where = { id: ids.map(m => m.id) };
                    return this.model.findAll(q);
                });
            }
            else {
                result = this.model.findAll(this.q).then(m => {
                    if (this.formatter)
                        return m.map(mm => this.formatter.format(mm));
                    return m;
                });
            }
        }
        else {
            result = this.model.find(this.q).then(m => this.formatter ? this.formatter.format(m) : m);
        }
        const done = () => {
            this.handlers = [];
            this.running = false;
            this.emit('done');
        };
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
exports.QueueItem = QueueItem;
class Queue {
    constructor(model) {
        this.model = model;
        this.queue = [];
    }
    remove(item) {
        this.queue.splice(this.queue.indexOf(item), 1);
    }
    add(key, type, q, formatter) {
        let item = new QueueItem(key, type, this.model, q, formatter);
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
        let promise = orange_1.deferred();
        item.add(promise);
        return promise.promise;
    }
    findOne(key, q, formatter) {
        return this.add(key, QueryType.One, q, formatter);
    }
    findAll(key, q, formatter) {
        return this.add(key, QueryType.All, q, formatter);
    }
}
exports.Queue = Queue;
