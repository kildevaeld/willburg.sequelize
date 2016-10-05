
import * as SQ from 'sequelize';
import {AbstractCreator, IModel} from '../../../lib'

export interface Blog extends IModel {
    title: string;
    body: string;
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

