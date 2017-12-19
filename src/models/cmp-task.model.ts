/**
 * 比较任务包括驱动模型运行的配置，和模型比较的配置
 * cmp task 和参与比较的model task相关联
 */

import { Mongoose } from './mongoose.base';
import * as mongoose from 'mongoose';
import { ResourceSrc } from './resource.enum';

import { GeoDataClass } from './UDX-data.model';

class CmpTaskDB extends Mongoose {
    constructor() {
        const collectionName = 'CmpTask';
        const schema = {
            meta: mongoose.Schema.Types.Mixed,
            auth: mongoose.Schema.Types.Mixed,
            cmpCfg: mongoose.Schema.Types.Mixed,
            calcuCfg: mongoose.Schema.Types.Mixed,
            calcuTasks: mongoose.Schema.Types.Mixed
        };

        super(collectionName, schema);
    }
}

export const cmpTaskDB = new CmpTaskDB();

export class CmpTask {
    _id?: any;
    meta: {
        name: string,
        desc: string,
        time: number
    };
    auth: {
        src: ResourceSrc,
        userId: string
    };
    cmpCfg: {
        solutionId: string
        // TODO 相关比较的结果对象
    };
    calcuCfg: CalcuCfg;
    calcuTasks: Array<string>;
}

export class CalcuCfg {
    dataSrc: 'std' | 'upload';
    // upload
    dataRefer?: Array<{
        msId: string,
        eventName: string,
        dataId: string
    }>;
    // TODO 没必要？
    dataList?: Array<GeoDataClass>;
    // std  时空
    stdSrc?: {
        spatial?: {
            dimension?: 'point' | 'polygon' | 'multi-point',
            // point
            point?: {
                lat: string,
                long: string
            },
            // polygon
            // ncols?: number,
            // nrows?: number,
            // yllcorner?: number,
            // xllcorner?: number,
            // cellsize?: number,
            // NODATA_value?: number
            polygon?: any
        },
        temporal?: {
            start: number,
            end: number,
            scale: 'YEAR' | 'DAY'
        }
    }
}
