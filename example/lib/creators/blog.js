"use strict";
const lib_1 = require('../../../lib');
class BlogCreator extends lib_1.AbstractCreator {
    constructor() {
        super(...arguments);
        this.schema = {
            type: "object",
            properties: {
                title: {
                    type: "string"
                },
                body: {
                    type: "string"
                }
            }
        };
    }
    doUpdate(model, data, state, t) {
        model.body = data.body;
        model.title = data.title;
        return model.save();
    }
}
exports.BlogCreator = BlogCreator;
