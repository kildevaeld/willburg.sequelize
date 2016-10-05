
import {Willburg} from 'willburg'
import {Sequelize} from '../../../lib'
import {Blog} from '../models/blog';

export default function (app:Willburg) {

    let db: Sequelize = app.container.get(Sequelize);

    db.api<Blog>("blog", (factory) => {
        factory.creator(BlogCreator)
        .path('/blog')
    })

}