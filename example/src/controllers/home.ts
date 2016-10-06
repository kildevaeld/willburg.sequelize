
import {Controller, decorators, Context} from 'willburg';
import {Sequelize} from '../../../lib'
import {Blog, BlogAttributes} from '../models/blog'
import {BlogCreator} from '../creators/blog'


@decorators.controller()
export class HomeController {

    constructor(private db: Sequelize, private create: BlogCreator) {
        
    }

    @decorators.get('/')
    async index(ctx: Context) {

        let blog = await this.db.model<Blog, BlogAttributes>("blog").build();
        
        blog = await this.create.update(blog, {
            title: "Hello, World",
            body: "This is a body"
        });

        ctx.body = blog;

    }

}