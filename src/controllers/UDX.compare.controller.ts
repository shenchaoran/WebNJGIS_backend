import * as Promise from 'bluebird';
import * as _ from 'lodash';
import * as path from 'path';
import * as fs from 'fs';

import {
    UDXTableXML,
    geoDataDB,
    CmpMethodEnum,
    SchemaName,
    UDXCfg,
    CmpState,
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
                    let promise;
                    let key;
                    switch(method) {
                        case CmpMethodEnum[CmpMethodEnum.ASCII_GRID_STATISTIC]:
                            promise = PropCtrl.statisticRAWAscii(doc); 
                            key = 'statistic';
                            break;
                        case CmpMethodEnum[CmpMethodEnum.ASCII_GRID_VISUALIZATION]:
                            // TODO
                            promise = VisualCtrl.showRAWAscii(doc);
                            key = 'image';
                            break;
                        case CmpMethodEnum[CmpMethodEnum.ASCII_GRID_BATCH_VISUALIZATION]:
                            promise = VisualCtrl.showRAWAsciiBatch(doc);
                            key = 'image';
                            break;
                        case CmpMethodEnum[CmpMethodEnum.GIF]:
                            promise =  VisualCtrl.showGIF(doc);
                            key = 'GIF';
                            break;
                        case CmpMethodEnum[CmpMethodEnum.SHAPEFILE_INTERPOLATION]:
                            promise =  VisualCtrl.showRAWShp_INTERPOLATION(doc);
                            key = '';
                            break;
                        case CmpMethodEnum[CmpMethodEnum.SHAPEFILE_STATISTIC]:
                            promise =  PropCtrl.statisticRAWShp(doc);
                            key = 'statistic';
                            break;
                        case CmpMethodEnum[CmpMethodEnum.SHAPEFILE_VISUALIZATION]:
                            promise =  VisualCtrl.showRAWShp(doc);
                            key = '';
                            break;
                        case CmpMethodEnum[CmpMethodEnum.TABLE_CHART]:
                            promise =  VisualCtrl.showRAWTable(doc);
                            key = 'chart';
                            break;
                        case CmpMethodEnum[CmpMethodEnum.TABLE_STATISTIC]:
                            promise =  PropCtrl.statisticRAWTable(doc);
                            key = 'statistic';
                            break;
                    }
                    return new Promise((resolve, reject) => {
                        return promise
                            .then(resolve)
                            .catch(e => {
                               console.log(e);
                               const rst = {};
                               rst[key] = {state: CmpState.FAILED};
                               return resolve(rst);
                           });
                    });
                });
                return new Promise((resolve, reject) => {
                    Promise.all(promises)
                        .then(rsts => {
                            let cmpRst = {};
                            _.map(rsts, rst => (cmpRst = {...rst, ...cmpRst}));
                            return resolve(cmpRst);
                        });
                        // 这里不会出现reject ，出错的情况全部将state 设置为Failed 了
                        // .catch(err => {
                        //     return reject(err);
                        // });
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
