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
export interface IModel {
    toJSON(): any;
    get(key: string): any;
    destroy(): Promise<any>;
    save(): Promise<this>;
    validate(): Promise<void>;
    id: any;
}
export interface IModelList<T extends IModel> {
    tableAttributes: any;
    findOne(o: string | number | Query, ...args: any[]): Promise<T>;
    findOrBuild(o?: any, ...args: any[]): Promise<T>;
    findOrCreate(o?: any, ...args: any[]): Promise<[T, boolean]>;
    findAll(o?: Query, ...args: any[]): Promise<T[]>;
    findById(id: any, ...args: any[]): Promise<T>;
    count(o?: Query, ...args: any[]): Promise<number>;
    create(o?: any, ...args: any[]): Promise<T>;
    bulkCreate(o?: any): Promise<T[]>;
    build(o?: any): T;
}
