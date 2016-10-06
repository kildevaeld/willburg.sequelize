import { Model, Instance } from 'sequelize';
export interface Query {
    where?: any[] | {
        [key: string]: any;
    };
    limit?: number;
    offset?: number;
    include?: any;
    order?: string | string[] | string[][];
    attributes?: string[];
}
export interface Transaction {
    commit(): Promise<any>;
    rollback(): Promise<any>;
}
export interface IModel<T> extends Instance<T> {
}
export interface IModelList<T extends IModel<U>, U> extends Model<T, U> {
    tableAttributes: any;
}
