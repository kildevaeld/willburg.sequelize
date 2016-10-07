
export * from './interfaces';
export * from './sequelize'
export * from './task';
export * from './resource';
export * from './query-formatter';
export {ICreator, ICreatorConstructor, AbstractCreator, creator} from './creator'

import {Willburg} from 'willburg';

import {Options, Sequelize} from './sequelize';
import {CreatorTask, FormatterTask, ModelTask} from './task'


export function register(app:Willburg, config: Options) {

    app.register(Sequelize)
    .register(CreatorTask)
    .register(FormatterTask)
    .register(ModelTask)
    
}