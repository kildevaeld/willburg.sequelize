"use strict";
function __export(m) {
    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}
__export(require("./sequelize"));
__export(require("./task"));
__export(require("./resource"));
__export(require("./query-formatter"));
var creator_1 = require("./creator");
exports.AbstractCreator = creator_1.AbstractCreator;
exports.creator = creator_1.creator;
const sequelize_1 = require("./sequelize");
const task_1 = require("./task");
function register(app, config) {
    app.register(sequelize_1.Sequelize)
        .register(task_1.CreatorTask)
        .register(task_1.FormatterTask)
        .register(task_1.ModelTask);
}
exports.register = register;
