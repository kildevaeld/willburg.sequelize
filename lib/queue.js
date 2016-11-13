"use strict";
const orange_1 = require('orange');
const events_1 = require('events');
(function (QueryType) {
    QueryType[QueryType["One"] = 0] = "One";
    QueryType[QueryType["All"] = 1] = "All";
})(exports.QueryType || (exports.QueryType = {}));
var QueryType = exports.QueryType;
class QueueItem extends events_1.EventEmitter {
    constructor(type, model, q, formatter) {
        super();
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
        return orange_1.equal(this.q, other.q) && orange_1.equal(this.formatter, other.formatter) && this.type == other.type;
    }
    run() {
        if (this.running)
            return;
        this.running = true;
        let result;
        if (this.type === QueryType.All) {
            result = this.model.findAll(this.q).then(m => m.map(mm => this.formatter.format(mm)));
        }
        else {
            result = this.model.find(this.q).then(m => this.formatter.format(m));
        }
        const done = () => {
            this.handlers = [];
            this.running = false;
            this.emit('done');
        };
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
exports.QueueItem = QueueItem;
class Queue {
    constructor(model) {
        this.model = model;
        this.queue = [];
    }
    remove(item) {
        this.queue.splice(this.queue.indexOf(item), 1);
    }
    add(type, q, formatter) {
        let item = new QueueItem(type, this.model, q, formatter);
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
        }
        let promise = orange_1.deferred();
        item.add(promise);
        return promise.promise;
    }
    findOne(q, formatter) {
        return this.add(QueryType.One, q, formatter);
    }
    findAll(q, formatter) {
        return this.add(QueryType.All, q, formatter);
    }
}
exports.Queue = Queue;
