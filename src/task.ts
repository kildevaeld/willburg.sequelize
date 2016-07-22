
import {QueryFormatter} from './query-formatter';
import {decorators, Willburg, ITask} from 'willburg';
import {processDirectory, requireDir} from 'willburg/lib/utils';
import {Sequelize} from './sequelize';
import * as Debug from 'debug';
import * as Path from 'path';

const debug = Debug('willburg:sequelize:task');

/**
 * ModelTask initializes models and loads creators
 */
@decorators.inject(Sequelize)
@decorators.task()
export class ModelTask implements ITask {
    name = "Models";
    modelPath: string = "lib/models"

    constructor(private sequelize: Sequelize) { }

    async run(app: Willburg): Promise<void> {

        let modelPath = this.sequelize.options.models

        try {
            try {
                await processDirectory(modelPath, (mod: any, _, path: string) => {
                debug("loading models from path: %s", path)
                mod.call(undefined, this.sequelize.seq, Sequelize.DataTypes);
            });

            } catch (e) {
                debug('could not load models')
            }
            let formatters = this.sequelize.options.formatters;
            if (formatters) {
                await requireDir(formatters, (mod: any, path: string) => {
                    debug("loading formattter from path: %s", path);
                    if (mod.default) mod = mod.default;
                    let formatter = new QueryFormatter(this.sequelize, mod)
                   
                    let name = mod.name||Path.basename(path, Path.extname(path));
                    
                    this.sequelize['_formatters'][name] = formatter;
                    
                    return Promise.resolve();
                });
            }

            let routes = this.sequelize.options.routes;
            if (routes) {
                await processDirectory(routes, (mod: any, path: string) => {
                    debug("loading model routes from path: %s", path);
                    return mod.call(undefined, this.sequelize);
                });
            }

            

        } catch (e) {
            if (e.code == 'ENOENT') {
                debug('Directory "%s" does not exists', e.path)
                return;
            }
            throw e;
        }

    }
}
