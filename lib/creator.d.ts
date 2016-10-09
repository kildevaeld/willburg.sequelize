import { IModel, Transaction } from './interfaces';
import { Sequelize } from './sequelize';
export declare const CreatorMetaKey: symbol;
export interface ICreator<T extends IModel<U>, U> {
    update(model: T, data: any, state?: any, wrap?: boolean): Promise<T>;
    remove(model: T): Promise<void>;
}
export interface ICreatorConstructor<T extends IModel<U>, U> {
    new (...args: any[]): ICreator<T, U>;
}
export declare abstract class AbstractCreator<T extends IModel<U>, U, S> implements ICreator<T, U> {
    protected db: Sequelize;
    schema: any;
    private _validator;
    constructor(db: Sequelize);
    update(model: T, data: any, state?: S, wrap?: boolean): Promise<T>;
    protected validate(data: any): Promise<void>;
    remove(model: T): Promise<void>;
    protected abstract doUpdate(model: T, data: any, state?: S, t?: Transaction): Promise<T>;
    protected loadSchema(uri: string, cb: Function): void;
}
export declare function creator(name?: string): ClassDecorator;
