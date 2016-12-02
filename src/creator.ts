
import { IModel, Transaction } from './interfaces';
import { Sequelize } from './sequelize';
export const CreatorMetaKey = Symbol.for("sequelize::creator::key")
import { inject } from 'willburg/lib/decorators'
import * as Ajv from 'ajv'

export interface ICreator<T extends IModel<U>, U> {
    update(model: T, data: any, state?: any, wrap?: boolean): Promise<T>;
    remove(model: T): Promise<void>;
}

export interface ICreatorConstructor<T extends IModel<U>, U> {
    new (...args: any[]): ICreator<T, U>
}

@inject(Sequelize)
export abstract class AbstractCreator<T extends IModel<U>, U, S> implements ICreator<T, U> {
    schema: any;
    private _validator: any;

    constructor(protected db: Sequelize) { }

    update(model: T, data: any, state?: S, wrap: boolean = false): Promise<T> {

        return this.validate(data).then(_ => {

            if (wrap) {
                return this.db.transaction((t) => {
                    return this.doUpdate(model, data, state, t as any);
                });
            }
            return this.doUpdate(model, data, state, null);

        }).then(m => m == null ? model : m);
    }

    protected validate(data: any): Promise<void> {
        if (this._validator == null) {
            if (this.schema == null) return Promise.resolve();
            let ajv = new Ajv({ async: true, loadSchema: this.loadSchema.bind(this) });

            return new Promise<void>((resolve, reject) => {
                ajv.compileAsync(this.schema, (err, validator) => {

                    if (err) return reject(err);
                    this._validator = validator;

                    let valid = validator(data);

                    if (!valid) {
                        reject(validator.errors);
                    } else {
                        resolve();
                    }
                });
            });
        }


        let valid = this._validator(data);

        return valid === true ? Promise.resolve() : Promise.reject(this._validator.errors);

    }

    remove(model: T): Promise<void> {
        return model.destroy() as any;
    }

    protected abstract doUpdate(model: T, data: any, state?: S, t?: Transaction): Promise<T>;


    protected loadSchema(uri: string, cb: Function) {
        cb(new Error('no schema named: ' + uri));
    }

}

export function creator(name?: string): ClassDecorator {
    return function <T extends ICreatorConstructor<IModel<any>, any>>(target: T) {
        Reflect.defineMetadata(CreatorMetaKey, name || target.name, target);
    }
}