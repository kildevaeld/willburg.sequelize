
import * as SQ from 'sequelize';
import {AbstractCreator, IModel} from '../../../lib'

export interface BlogAttributes {
    title: string;
    body: string;
}

export interface Blog extends IModel<BlogAttributes>, BlogAttributes {
    
}

export default function (s: SQ.Sequelize, types: SQ.DataTypes) {
    return s.define("blog", {
        title: {
            type: types.STRING
        },
        body: {
            type: types.STRING
        }
    });
}

