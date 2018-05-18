import { stdDataDB, geoDataDB, siteDB } from '../models';
import * as proj4x from 'proj4';
const proj4 = (proj4x as any).proj4;
import * as Promise from 'bluebird';
import * as _ from 'lodash';
import * as RequestCtrl from './request.controller';
import { setting } from '../config/setting';
import * as path from 'path';
const fs = Promise.promisifyAll(require('fs'));

/**
 * 通过std data configure从 std data中 获取到模型计算所需要的那部分
 * @param stdInputId std data id in DB
 * @param std std data configure list of msInstance
 * @returns {Promise<string>} ioStr
 */
export const IBIS_point_std_getter = (stdInputId, stdOutputId, msInstance) => {
    let stdInputDoc, stdOutputDoc, ioStr;
    let std = msInstance.IO.std;
    return Promise.all([
        stdDataDB.findOne({ _id: stdInputId }),
        stdDataDB.findOne({ _id: stdOutputId })
    ])
        .then(v => {
            stdInputDoc = v[0];
            stdOutputDoc = v[1];
            let coor = parseCoor(std);
            const group = coor.match(/\[(.*),(.*)\]/);
            if(group.length >=3) {
                return siteDB.findOne({
                    x: parseFloat(group[1]),
                    y: parseFloat(group[2])
                });    
            }
            else {
                console.log('convert coor');
            }
        })
        .then(site => {
            const index = site.index;
            const iRootPath = stdInputDoc.content.rootPath;
            const oRootPath = stdOutputDoc.content.rootPath;

            const iPath = path.join(iRootPath, 'csv', index + '_proced.csv');
            const oPath = path.join(oRootPath, index + '_IBIS_output.txt');
            const sPath = path.join(iRootPath, 'txt', index + '.txt');
            const ioStr = `-i=${iPath} -o=${oPath} -s=${sPath}`;

            // TODO 这样处理的话，其他类别的标准数据集接入就会出问题，待优化
            const setEventV = (type) => {
                _.map(msInstance.IO[type] as any[], event => {
                    event.value = index;
                });
            }

            return fs.statAsync(oPath)
                .then(stat => {
                    setEventV('inputs');
                    setEventV('outputs');
                    return Promise.resolve({
                        runned: true
                    });
                })
                .catch(e => {
                    if(e.code === 'ENOENT') {
                        setEventV('inputs');
                        return Promise.resolve({
                            runned: false,
                            ioStr: ioStr
                        });
                    }
                    else {
                        return Promise.reject('fs state err: ' + JSON.stringify(e))
                    }
                });
        });
}

export const Biome_BGC_point_std_getter = (stdInputId, stdOutputId, std) => {
    let stdInputDoc, stdOutputDoc, ioStr;
    return Promise.all([
        stdDataDB.findOne({ _id: stdInputId }),
        stdDataDB.findOne({ _id: stdOutputId })
    ])
        .then(v => {
            stdInputDoc = v[0];
            stdOutputDoc = v[1];
            const coor = parseCoor(std);
            return siteDB.findOne({
                x: coor[0],
                y: coor[1]
            });
        })
        .then(site => {
            const index = site.index;
            const iRootPath = stdInputDoc.content.rootPath;
            const oRootPath = stdOutputDoc.content.rootPath;

            const iPath = path.join(iRootPath, 'csv', index + '_proced.csv');
            const oPath = path.join(oRootPath, index + '_IBIS_output.txt');
            const sPath = path.join(iRootPath, 'txt', index + '.txt');
            ioStr = `-i=${iPath} -o=${oPath} -s=${sPath}`;

            return fs.statAsync(oPath)
                .then(stat => {
                    return Promise.resolve({
                        runned: true
                    });
                })
                .catch(e => {
                    return Promise.resolve({
                        runned: false,
                        ioStr: ioStr
                    });
                });
        });
}

const parseCoor = (stdList) => {
    let coorE = _.find(stdList as any[], event => event.id === '-coor' || event.id === '--coordinate');
    return coorE? coorE.value: undefined;
}