import {Model, Instance} from 'sequelize'

export interface Query {
    where?:any[]|{[key:string]: any};
    limit?: number;
    offset?: number;
    include?: any;
    order?: string|string[]|string[][];
    attributes?: string[];
}

export interface Transaction {
  commit(): Promise<any>;
  rollback(): Promise<any>;
}

export interface IModel extends Instance<any> {
    //toJSON(): any;
    //get(key: string): any;
    //destroy(): Promise<any>;
    //save(): Promise<this>
    //validate(): Promise<void>;
    //id: any;
}

export interface IModelList<T extends IModel> extends Model<T, T> {
    tableAttributes:any;
    /*findOne(o:string|number|Query, ...args): Promise<T>;
    findOrBuild(o?, ...args): Promise<T>;
    findOrCreate(o?, ...args): Promise<[T, boolean]>;
    findAll(o?:Query, ...args): Promise<T[]>;
    findById(id:any, ...args): Promise<T>
    count(o?:Query, ...args): Promise<number>;
    create(o?, ...args): Promise<T>;
    bulkCreate(o?): Promise<T[]>
    build(o?): T;*/
}