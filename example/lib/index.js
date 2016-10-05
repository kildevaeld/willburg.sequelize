"use strict";
const willburg_1 = require('willburg');
const index_1 = require('../../lib/index');
let app = new willburg_1.Willburg({
    directories: ['lib/controllers'],
    paths: {
        initializers: 'lib/initializers'
    }
});
app.register(index_1.Sequelize);
app.register(index_1.ModelTask);
app.register(index_1.CreatorTask);
let options = app.configure(index_1.Sequelize);
options.extend({
    dialect: 'sqlite',
    storage: 'test.sqlite',
    models: 'lib/models'
});
app.startAndListen(8080)
    .then(() => {
    let sq = app.container.get(index_1.Sequelize);
    return sq.sync().then(() => sq);
})
    .then(sq => {
    return sq.model('blog').create({
        title: "Blog 1",
        body: "Hello"
    });
})
    .catch(e => {
    console.log(innerError(e));
});
function innerError(e) {
    if (e.errors && e.errors.length) {
        return innerError(e.errors[0]);
    }
    return e.message;
}
