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
        [key: string]: (model: IModelList<IModel>, args: any[], o?) => any;
    };
    static filters: {
        [key: string]: (model: any, args: any[]) => any;
    };
    idAttribute: string;
    description: FormatDescription;
    constructor(db: Sequelize, _desc: FormatDescription);
    format(model: IModel): any;
    _formatDescription(model: IModel, desc: FormatDescription): any;
    query(o?: {}): Query;
    private _parseDescription(desc, o?);
    private _parseWhere(desc);
    private _parseQueries(desc, o);
    private _parseIncludes(desc);
    private _parseColumns(desc);
}
