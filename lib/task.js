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
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const creator_1 = require("./creator");
const query_formatter_1 = require("./query-formatter");
const willburg_1 = require("willburg");
const utils_1 = require("willburg/lib/utils");
const sequelize_1 = require("./sequelize");
const SequelizeKlass = require("sequelize");
const Debug = require("debug");
const Path = require("path");
const debug = Debug('willburg:sequelize:task');
/**
 * ModelTask initializes models and loads creators
 */
let ModelTask = class ModelTask {
    constructor(sequelize) {
        this.sequelize = sequelize;
        this.name = "Models";
        this.modelPath = "lib/models";
    }
    run(app) {
        return __awaiter(this, void 0, void 0, function* () {
            let modelPath = this.sequelize.options.models;
            try {
                try {
                    yield utils_1.processDirectory(modelPath, (mod, _, path) => {
                        debug("loading models from path: %s", path);
                        mod.call(undefined, this.sequelize, SequelizeKlass.DataTypes);
                    });
                }
                catch (e) {
                    debug('could not load models: %s', e);
                }
                let routes = this.sequelize.options.routes;
                if (routes) {
                    yield utils_1.processDirectory(routes, (mod, path) => {
                        debug("loading model routes from path: %s", path);
                        return mod.call(undefined, this.sequelize);
                    });
                }
            }
            catch (e) {
                if (e.code == 'ENOENT') {
                    debug('Directory "%s" does not exists', e.path);
                    return;
                }
                throw e;
            }
        });
    }
};
ModelTask = __decorate([
    willburg_1.decorators.inject(sequelize_1.Sequelize),
    willburg_1.decorators.task()
], ModelTask);
exports.ModelTask = ModelTask;
let CreatorTask = class CreatorTask {
    constructor(db) {
        this.db = db;
        this.name = "CreatorTask";
    }
    run(app) {
        return __awaiter(this, void 0, void 0, function* () {
            let creators = this.db.options.creators;
            if (creators) {
                yield utils_1.processDirectory(creators, (mod, path) => {
                    if (Reflect.hasOwnMetadata(creator_1.CreatorMetaKey, mod)) {
                        let name = Reflect.getOwnMetadata(creator_1.CreatorMetaKey, mod);
                        debug("register creator %s at path: %s", name, path, creators);
                        app.container.registerTransient(name, mod);
                    }
                });
            }
        });
    }
};
CreatorTask = __decorate([
    willburg_1.decorators.inject(sequelize_1.Sequelize),
    willburg_1.decorators.task()
], CreatorTask);
exports.CreatorTask = CreatorTask;
let FormatterTask = class FormatterTask {
    constructor(db) {
        this.db = db;
        this.name = "FormatterTask";
    }
    run(app) {
        return __awaiter(this, void 0, void 0, function* () {
            let formatters = this.db.options.formatters;
            if (formatters) {
                yield utils_1.requireDir(formatters, (mod, path) => {
                    debug("loading formattter from path: %s", path);
                    if (mod.default)
                        mod = mod.default;
                    let formatter = new query_formatter_1.QueryFormatter(this.db, mod);
                    let name = mod.name || Path.basename(path, Path.extname(path));
                    this.db['_formatters'][name] = formatter;
                    return Promise.resolve();
                });
            }
        });
    }
};
FormatterTask = __decorate([
    willburg_1.decorators.inject(sequelize_1.Sequelize),
    willburg_1.decorators.task()
], FormatterTask);
exports.FormatterTask = FormatterTask;
