import * as Promise from 'bluebird';
import * as _ from 'lodash';
import * as path from 'path';
import * as fs from 'fs';

import {
    UDXTableXML,
    geoDataDB,
    CmpMethodEnum,
    SchemaName,
    UDXCfg
} from '../models';
import * as PropCtrl from './UDX.property.controller';
import * as VisualCtrl from './UDX.visualization.controller';

/**
 * deprecated
 */
export const compare_old = (UDXs: Array<UDXCfg>): Promise<any> => {
    const types = _.chain(UDXs)
        .map(udxcfg => udxcfg.schema$.id)
        .value();
    const uniqTypes = _.uniq(types);
    if (uniqTypes.length === 1) {
        let promise;
        if (uniqTypes[0] === SchemaName[SchemaName.TABLE_RAW]) {
            promise = compareRAWTable(UDXs);
        } else if (uniqTypes[0] === SchemaName[SchemaName.ASCII_GRID_RAW]) {
            promise = compareRAWAscii(UDXs);
        } else if (uniqTypes[0] === SchemaName[SchemaName.SHAPEFILE_RAW]) {
            promise = compareRAWShp(UDXs);
        } else {
            return Promise.reject(new Error('todo'));
        }
        return promise;
    } else {
        const err = new Error("Can't compare between different types of UDX!");
        return Promise.reject(err);
    }
};

/**
 * 对一个数据从多种方法层面上对比 
 */
export const compare = (dataId: string, methods: string[]): Promise<any> => {
    return new Promise((resolve, reject) => {
        geoDataDB
            .find({ _id: dataId })
            .then(docs => {
                if (docs.length) {
                    return Promise.resolve(docs[0]);
                } else {
                    return reject(new Error("can't find related geo-data!"));
                }
            })
            .then(doc => {
                const promises = _.map(methods, method => {
                    switch(method) {
                        case CmpMethodEnum[CmpMethodEnum.ASCII_GRID_STATISTIC]:
                            return PropCtrl.statisticRAWAscii(doc); 
                        case CmpMethodEnum[CmpMethodEnum.ASCII_GRID_VISUALIZATION]:
                            // TODO
                            // return VisualCtrl.showRAWAscii(doc);
                            return VisualCtrl.showRAWAsciiBatch(doc);
                        case CmpMethodEnum[CmpMethodEnum.GIF]:
                            return VisualCtrl.showGIF(doc);
                        case CmpMethodEnum[CmpMethodEnum.SHAPEFILE_INTERPOLATION]:
                            return VisualCtrl.showRAWShp_INTERPOLATION(doc);
                        case CmpMethodEnum[CmpMethodEnum.SHAPEFILE_STATISTIC]:
                            return PropCtrl.statisticRAWShp(doc);
                        case CmpMethodEnum[CmpMethodEnum.SHAPEFILE_VISUALIZATION]:
                            return VisualCtrl.showRAWShp(doc);
                        case CmpMethodEnum[CmpMethodEnum.TABLE_CHART]:
                            return VisualCtrl.showRAWTable(doc);
                        case CmpMethodEnum[CmpMethodEnum.TABLE_STATISTIC]:
                            return PropCtrl.statisticRAWTable(doc);
                        default:
                            throw new Error('Error comparison method!');
                    }
                });
                return new Promise((resolve, reject) => {
                    Promise.all(promises)
                        .then(rsts => {
                            let cmpRst = {};
                            _.map(rsts, rst => (cmpRst = {...rst, ...cmpRst}));
                            return resolve(cmpRst);
                        })
                        .catch(err => {
                            return reject(err);
                        });
                });
            })
            .then(rsts => {
                resolve(rsts);
            })
            .catch(reject);
    });
};

const compareRAWTable = (UDXs: Array<UDXCfg>): Promise<any> => {
    return new Promise((resolve, reject) => {
        Promise.all(_.map(UDXs, PropCtrl.parse))
            .then(resolve)
            .catch(reject);
    });
};

const compareRAWAscii = (UDXs: Array<UDXCfg>): Promise<any> => {
    return;
};

const compareRAWShp = (UDXs: Array<UDXCfg>): Promise<any> => {
    return;
};

/**
 * 启动新进程调用本文件中的函数，调用完成后给调用端发送消息
 */
process.on('message', m => {
    if (m.code === 'start') {
        return new Promise((resolve, reject) => {
            compare(m.dataId, m.methods)
                .then(resolve)
                .catch(reject);
        });
    }
});
