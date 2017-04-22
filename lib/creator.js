"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("./sequelize");
exports.CreatorMetaKey = Symbol.for("sequelize::creator::key");
const decorators_1 = require("willburg/lib/decorators");
const Ajv = require("ajv");
let AbstractCreator = class AbstractCreator {
    constructor(db) {
        this.db = db;
    }
    update(model, data, state, wrap = false) {
        return this.validate(data).then(_ => {
            if (wrap) {
                return this.db.transaction((t) => {
                    return this.doUpdate(model, data, state, t);
                });
            }
            return this.doUpdate(model, data, state, null);
        }).then(m => m == null ? model : m);
    }
    validate(data) {
        if (this._validator == null) {
            if (this.schema == null)
                return Promise.resolve();
            let ajv = new Ajv({ async: true, loadSchema: this.loadSchema.bind(this) });
            return new Promise((resolve, reject) => {
                ajv.compileAsync(this.schema, (err, validator) => {
                    if (err)
                        return reject(err);
                    this._validator = validator;
                    let valid = validator(data);
                    if (!valid) {
                        reject(validator.errors);
                    }
                    else {
                        resolve();
                    }
                });
            });
        }
        let valid = this._validator(data);
        return valid === true ? Promise.resolve() : Promise.reject(this._validator.errors);
    }
    remove(model) {
        return model.destroy();
    }
    loadSchema(uri, cb) {
        cb(new Error('no schema named: ' + uri));
    }
};
AbstractCreator = __decorate([
    decorators_1.inject(sequelize_1.Sequelize)
], AbstractCreator);
exports.AbstractCreator = AbstractCreator;
function creator(name) {
    return function (target) {
        Reflect.defineMetadata(exports.CreatorMetaKey, name || target.name, target);
    };
}
exports.creator = creator;
