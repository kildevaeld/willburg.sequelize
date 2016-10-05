import { Willburg, ITask } from 'willburg';
import { Sequelize } from './sequelize';
/**
 * ModelTask initializes models and loads creators
 */
export declare class ModelTask implements ITask {
    private sequelize;
    name: string;
    modelPath: string;
    constructor(sequelize: Sequelize);
    run(app: Willburg): Promise<void>;
}
export declare class CreatorTask implements ITask {
    private db;
    name: string;
    constructor(db: Sequelize);
    run(app: Willburg): Promise<void>;
}
