import * as proj4x from 'proj4';
const proj4 = (proj4x as any).proj4;
import * as Promise from 'bluebird';
import * as _ from 'lodash';
import * as RequestCtrl from './request.controller';
import { setting } from '../config/setting';
import * as path from 'path';
const fs = Promise.promisifyAll(require('fs'));
import { STD_DATA } from './STD_DATA.interface';
import {
    Event,
    CalcuTask,
    stdDataDB,
    geoDataDB,
    siteDB,
} from '../models';

export class IBIS_STD_DATA implements STD_DATA {
    name = 'IBIS_STD_DATA';
    inputPath = setting.STD_DATA.IBIS_STD_DATA.inputPath;
    outputPath = setting.STD_DATA.IBIS_STD_DATA.outputPath;

    /**
     * 通过std data configure从 std data中 获取到模型计算所需要的那部分，同时将数据的下载链接存到 event.url 里
     * @param stdInputId std data id in DB
     * @param std std data configure list of msInstance
     * @returns {Promise<string>} ioStr
     */
    getExeInvokeStr(stdId: string, msInstance: CalcuTask): Promise<any> {
        let ioStr;
        let std = msInstance.IO.std;
        let coor = parseCoor(std);
        const group = coor.match(/\[(.*),(.*)\]/);
        if (group.length < 3) {
            console.log('invalid coor');
            return Promise.reject('invalid coor');
        }
        return siteDB.findOne({
            x: parseFloat(group[1].trim()),
            y: parseFloat(group[2].trim())
        })
            .then(site => {
                const index = site.index;
                const iRootPath = setting.STD_DATA.IBIS_STD_DATA.inputPath;
                const oRootPath = setting.STD_DATA.IBIS_STD_DATA.outputPath;

                const iPath = path.join(iRootPath, 'csv', index + '_proced.csv');
                const oPath = path.join(oRootPath, index + '_IBIS_output.txt');
                const sPath = path.join(iRootPath, 'txt', index + '.txt');
                const ioStr = `-i=${iPath} -o=${oPath} -s=${sPath}`;

                // TODO 这样处理的话，其他类别的标准数据集接入就会出问题，待优化
                const setEventV = (type) => {
                    _.map(msInstance.IO[type] as any[], event => {
                        if (type === 'outputs' && msInstance.IO.dataSrc === 'STD') {
                            event.fname = _.cloneDeep(event.value) + event.ext;
                        }

                        if (msInstance.IO.dataSrc === 'STD') {
                            event.url = `/std-data/${this.name}?eventId=${event.id}&query=${index}`;
                        }
                        else if (msInstance.IO.dataSrc === 'UPLOAD') {
                            event.url = `/data/${event.value}`;
                        }
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
                        if (e.code === 'ENOENT') {
                            setEventV('inputs');
                            setEventV('outputs');
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

    downloadData(eventId, query): Promise<any> {
        let fpath, fname;
        if (eventId === '-i') {
            fname = query + '_proced.csv';
            fpath = path.join(this.inputPath, 'csv', fname);
        }
        else if (eventId === '-o') {
            fname = query + '_IBIS_output.txt';
            fpath = path.join(this.outputPath, fname);
        }
        else if (eventId === '-s') {
            fname = query + '.txt';
            fpath = path.join(this.inputPath, 'txt', fname);
        }
        return fs.readFileAsync(fpath)
            .then(data => {
                return Promise.resolve({
                    length: data.length,
                    filename: fname,
                    data: data
                });
            })
            .catch(e => {
                console.log(e);
                return Promise.reject('No file found!');
            })
    }
}

const parseCoor = (stdList) => {
    let coorE = _.find(stdList as any[], event => event.id === '-coor' || event.id === '--coordinate');
    return coorE ? coorE.value : undefined;
}