"use strict";
const lib_1 = require('../../../lib');
const blog_1 = require('../models/blog');
function default_1(app) {
    let db = app.container.get(lib_1.Sequelize);
    db.api("blog", (factory) => {
        factory.creator(blog_1.BlogCreator)
            .path('/blog');
    });
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = default_1;
