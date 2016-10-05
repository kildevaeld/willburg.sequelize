import { IModel, Transaction } from './interfaces';
import { Sequelize } from './sequelize';
export declare const CreatorMetaKey: symbol;
export interface ICreator<T extends IModel> {
    update(model: T, data: any, state?: any, wrap?: boolean): Promise<T>;
    remove(model: T): Promise<void>;
}
export interface ICreatorConstructor<T extends IModel> {
    new (...args: any[]): ICreator<T>;
}
export declare abstract class AbstractCreator<T extends IModel> implements ICreator<T> {
    protected db: Sequelize;
    schema: any;
    private _validator;
    constructor(db: Sequelize);
    update(model: T, data: any, state?: any, wrap?: boolean): Promise<T>;
    protected validate(data: any): Promise<void>;
    remove(model: T): Promise<void>;
    protected abstract doUpdate(model: T, data: any, state?: any, t?: Transaction): Promise<T>;
    protected loadSchema(uri: string, cb: Function): void;
}
export declare function creator(name?: string): ClassDecorator;
