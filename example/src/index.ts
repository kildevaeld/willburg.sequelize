
import {Willburg} from 'willburg';
import {Sequelize, SequelizeOptions, ModelTask, CreatorTask} from '../../lib/index'
import {Blog} from './models/blog';
let app = new Willburg({
    directories: ['lib/controllers'],
    paths: {
        initializers:'lib/initializers'
    }
});

app.register(Sequelize);
app.register(ModelTask);
app.register(CreatorTask)
let options = app.configure<SequelizeOptions>(Sequelize)

options.extend({
    dialect: 'sqlite',
    storage: 'test.sqlite',
    models: 'lib/models'
});

app.startAndListen(8080)
.then(() => {
    let sq: Sequelize = app.container.get(Sequelize)

    return sq.sync().then( () => sq)
})
.then( sq => {
    return sq.model<Blog,any>('blog').create({
        title: "Blog 1",
        body: "Hello"
    })
})
.catch( e => {
    console.log(innerError(e))
})

function innerError(e) {
    if (e.errors && e.errors.length) {
        return innerError(e.errors[0])
    }
    return e.message
}