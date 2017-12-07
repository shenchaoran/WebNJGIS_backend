/**
 * 比较任务包括驱动模型运行的配置，和模型比较的配置
 * cmp task 和参与比较的model task相关联
 */

import { Mongoose } from './mongoose.base';
import * as mongoose from 'mongoose';

import { GeoDataClass } from './UDX-data.model';

class CmpTaskDB extends Mongoose {
    constructor() {
        const collectionName = 'CmpTask';
        const schema = {
            
        };

        super(collectionName, schema);
    }
}

export const cmpTaskDB = new CmpTaskDB();

export class CmpTask {
    _id: mongoose.Schema.Types.ObjectId;
    meta: {
        name: string,
        desc: string,
        time: string,
        author: string
    };
    cmpCfg: {
        solutionId: string,
        dataList: Array<GeoDataClass>
    };
    calcuCfg: Array<{
        msId: string,
        eventName: string,
        dataId: string
    }>;
    calcuTasks: Array<string>;
}