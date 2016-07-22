"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator.throw(value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments)).next());
    });
};
const willburg_1 = require('willburg');
const Debug = require('debug');
const resource_1 = require('./resource');
const debug = Debug('willburg:sequelize');
const SequelizeKlass = require('sequelize');
const DataTypes = require('sequelize/lib/data-types');
const cls = require('continuation-local-storage');
class SequelizeOptions {
    set(opts) {
        Object.assign(this, opts);
    }
}
exports.SequelizeOptions = SequelizeOptions;
let Sequelize = class Sequelize {
    constructor(options, app) {
        this.options = options;
        this.app = app;
        this._formatters = {};
        this.factories = [];
        let o = options;
        SequelizeKlass.cls = cls.createNamespace("livejazz-admin");
        if (o.debug === true) {
            o.logging = Debug('sequelize:sql');
        }
        else {
            o.logging = null;
        }
        this.seq = new SequelizeKlass(o.database, o.username, o.password, o);
    }
    transaction(fn) {
        return this.seq.transaction(fn);
    }
    define(name, attr) {
        if (typeof attr === 'function') {
            return attr(this.seq, DataTypes);
        }
        return this.seq.define(name, attr);
    }
    model(name) {
        return this.seq.model(name);
    }
    query(sql, options) {
        return this.seq.query(...Array.prototype.slice.call(arguments));
    }
    formatter(name) {
        return this._formatters[name];
    }
    api(path, fn) {
        return __awaiter(this, void 0, void 0, function* () {
            let factory = new resource_1.ResourceFactory();
            factory.path(path);
            if (typeof fn === 'function')
                yield fn(factory);
            this.factories.push(factory);
            factory.create(this.app.router, this);
        });
    }
};
Sequelize.DataTypes = DataTypes;
Sequelize = __decorate([
    willburg_1.decorators.options(SequelizeOptions),
    willburg_1.decorators.inject(SequelizeOptions, willburg_1.Willburg),
    willburg_1.decorators.service()
], Sequelize);
exports.Sequelize = Sequelize;
