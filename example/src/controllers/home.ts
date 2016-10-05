
import {Controller, decorators, Context} from 'willburg';
import {Sequelize} from '../../../lib'
import {Blog} from '../models/blog'


@decorators.controller()
export class HomeController {

    constructor(private db: Sequelize) {
        
    }

    @decorators.get('/')
    async index(ctx: Context) {

        let blog = await this.db.model<Blog,Blog>("blog").findAll();

        ctx.body = blog;

    }

}