/**
 * TODO 与其说是对比，不如说是将每一种数据单独处理一下，前台展示他们的差别
 */

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
 * 对一个数据从多种方法层面上对比 
 */
export const compare = (dataId: string, methods: string[], field?: string): Promise<any> => {
    return new Promise((resolve, reject) => {
        geoDataDB
            .findOne({ _id: dataId })
            .then(doc => {
                const promises = _.map(methods, method => {
                    let promise;
                    let key;
                    // key 值 === 每个处理方法返回的对象里的key 值
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
                            promise =  VisualCtrl.extractRow(doc, field);
                            key = 'chart';
                            break;
                        case CmpMethodEnum[CmpMethodEnum.TABLE_STATISTIC]:
                            promise =  PropCtrl.statisticTableRow(doc, field);
                            key = 'statistic';
                            break;
                    }
                    return new Promise((resolve, reject) => {
                        return promise
                            .then(resolve)
                            .catch(e => {
                               console.log(e);
                               const rst = {};
                               rst[key] = {progress: -1};
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
                        // 这里不会出现reject ，出错的情况全部将 progress 设置为 -1 了
                });
            })
            .then(rsts => {
                resolve(rsts);
            })
            .catch(reject);
    });
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
