import {requireDir, processDirectory} from 'willburg/lib/utils';
import {decorators, Willburg, ITask, Configurable} from 'willburg'
import {IModel, IModelList, Transaction} from './interfaces';
import {QueryFormatter} from './query-formatter'
import * as Debug from 'debug';
import {ResourceFactory} from './resource'

const debug = Debug('willburg:sequelize')
const SequelizeKlass = require('sequelize');
const DataTypes = require('sequelize/lib/data-types');
const cls = require('continuation-local-storage');

export interface QueryOptions {
  replacements?: any[];
  model?: IModelList<IModel>;
  type?: any
}


export class SequelizeOptions {
    database: string;
    username: string;
    password: string;
    models: string;
    creators: string;
    routes: string;
    formatters: string;
    debug: boolean;
   
   set(opts: any) {
       Object.assign(this, opts);
   }
}

@decorators.options(SequelizeOptions)
@decorators.inject(SequelizeOptions, Willburg)
@decorators.service()
export class Sequelize implements Configurable<SequelizeOptions> {
    static DataTypes: any = DataTypes;
    seq: any;
    private _formatters: {[key: string]: QueryFormatter} = {};
    factories: ResourceFactory[] = [];
    constructor(public options: SequelizeOptions, public app: Willburg) {
        
        let o = options;
        
        SequelizeKlass.cls = cls.createNamespace("livejazz-admin");
        
        if (o.debug === true) {
            (<any>o).logging = Debug('willburg:sequelize:sql')
        } else {
            (<any>o).logging = null;
        }
        
        this.seq = new SequelizeKlass(o.database, o.username, o.password, o);
           
    }
    
    transaction<T>(fn:(t:Transaction) => Promise<T>): Promise<T> {
      return this.seq.transaction(fn);
    }

    define<T extends IModel>(name: string, attr: {[key:string]: string}|((Sequelize, DataTypes) => any)): IModelList<T> {
        if (typeof attr === 'function') {
            return (<any>attr)(this.seq, DataTypes);
        }
        return this.seq.define(name, attr);
    }
    

    model<T extends IModel>(name: string): IModelList<T> {
        return this.seq.model(name);
    }
    
    query<T extends IModel>(sql:string, options?:QueryOptions): Promise<T[]> {
        return this.seq.query(...Array.prototype.slice.call(arguments));
    }

    formatter(name:string): QueryFormatter {
        return this._formatters[name];
    }

    async api(path:string, fn: (factory: ResourceFactory) => void) {
        let factory = new ResourceFactory();
        factory.path(path);
        if (typeof fn === 'function') await fn(factory);
        this.factories.push(factory);
        factory.create(this.app.router, this);
    }

}

