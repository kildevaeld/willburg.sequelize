import {Blog, BlogAttributes} from '../models/blog';
import * as SQ from 'sequelize';
import {AbstractCreator, IModel} from '../../../lib'


export class BlogCreator extends AbstractCreator<Blog, BlogAttributes> {
    schema = {
        type: "object",
        properties: {
            title: {
                type: "string"
            },
            body: {
                type: "string"
            }
        }
    }
    doUpdate(model:Blog, data:any, state?: any, t?): Promise<Blog> {
        
        model.body = data.body;
        model.title = data.title;

        return model.save();
        
    }
}