import { Sequelize } from './sequelize';
import { Query, IModelList, IModel } from './interfaces';
export interface FormatDescription {
    model: string;
    as?: string;
    queries?: string[][];
    where?: string[];
    order?: string;
    filters: any[];
    columns: string[];
    include: FormatDescription[];
    limit?: number;
    offset?: number;
    idAttribute?: string;
}
export declare class QueryFormatter {
    private db;
    private _desc;
    static constants: {
        [key: string]: any;
    };
    static queries: {
        [key: string]: (model: IModelList<IModel<any>, any>, args: any[], o?) => any;
    };
    static filters: {
        [key: string]: (model: any, args: any[]) => any;
    };
    readonly idAttribute: string;
    readonly description: FormatDescription;
    constructor(db: Sequelize, _desc: FormatDescription);
    format<T>(model: IModel<T>): any;
    _formatDescription<T>(model: IModel<T>, desc: FormatDescription): T;
    query(o?: {}): Query;
    private _parseDescription(desc, o?);
    private _parseWhere(desc);
    private _parseQueries(desc, o);
    private _parseIncludes(desc);
    private _parseColumns(desc);
}
