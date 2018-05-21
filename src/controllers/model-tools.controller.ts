import { Response, Request, NextFunction } from 'express';
import * as Promise from 'bluebird';
import * as _ from 'lodash';
const xpath = require('xpath');
const dom = require('xmldom').DOMParser;
import { ObjectID } from 'mongodb';

import * as RequestCtrl from './request.controller';
import { setting } from '../config/setting';
import * as APIModel from '../models/api.model';
import DataCtrl from '../controllers/data.controller';
import {
    modelServiceDB,
    calcuTaskDB,
    CalcuTaskState,
    geoDataDB,
    ResourceSrc,
} from '../models';
import * as child_process from 'child_process';
const exec = child_process.exec;
const spawn = child_process.spawn;
import * as path from 'path';
import * as StdDataCtrl from './std-data.controller';
const db = modelServiceDB;

export default class ModelService {
    constructor() { }

    static findAll(): Promise<any> {
        return db.find({})
            .then(docs => {
                return Promise.resolve(docs);
            })
            .catch(Promise.reject)
    }

    static findByPage(pageOpt: {
        pageSize: number,
        pageNum: number
    }): Promise<any> {
        return db.findByPage({}, {
            pageSize: pageOpt.pageSize,
            pageNum: pageOpt.pageNum
        })
            .then(rst => {
                return Promise.resolve(rst);
            })
            .catch(Promise.reject);
    }

    static getModelDetail(id): Promise<any> {
        return db.findOne({ _id: id })
            .then(Promise.resolve)
            .catch(Promise.reject)
    }

    /**
     * 调用模型：实质上是插入 运行记录 文档，同时如果type==invoke时启动模型实例
     * 
     * @static
     * @param {any} msInstance 
     * @param {any} type 
     * @returns {Promise<any>} 
     * @memberof ModelService
     */
    static invoke(msInstance, type): Promise<any> {
        let ms;
        return new Promise((resolve, reject) => {
            calcuTaskDB.upsert({ _id: msInstance._id }, msInstance)
                .then(rst => {
                    if (type === 'save') {
                        return resolve(msInstance._id);
                    }
                    else if (type === 'invoke') {
                        return Promise.resolve();
                    }
                })
                .then(() => {
                    return modelServiceDB.findOne({ _id: msInstance.msId })
                })
                .then(v => {
                    ms = v;
                    if (msInstance.IO.dataSrc === 'STD') {
                        const STDClass = StdDataCtrl.get_STD_DATA_Class(ms.stdClass);
                        if (!STDClass) {
                            return reject('invalid STD_DATA_Class of ms!');
                        }
                        if (msInstance.IO.std.length === 0) {
                            return reject('invalid std input of msInstance!');
                        }
                        return new STDClass().getExeInvokeStr(ms.stdId, msInstance);
                    }
                    else if (msInstance.IO.dataSrc === 'UPLOAD') {
                        let ioStr = '';
                        let geodata = [];
                        // TODO 对输入输出文件的处理
                        let jointIOStr = (type) => {
                            _.map(msInstance.IO[type] as Array<any>, event => {
                                if (type === 'outputs') {
                                    event.fname = _.cloneDeep(event.value);
                                    let i = _.lastIndexOf(event.fname, event.ext);
                                    if (i === -1) {
                                        event.fname += event.ext;
                                    }
                                    event.value = new ObjectID().toHexString();
                                }
                                if (event.value && event.value !== '') {
                                    let fpath = path.join('\.\\..\\..\\geo-data', event.value + event.ext);
                                    // let fpath = path.join(setting.geo_data.path, event.value);
                                    ioStr += `${event.id}=${fpath}  `;
                                }
                                if (type !== 'parameters') {
                                    geodata.push({
                                        _id: new ObjectID(event.value),
                                        meta: {
                                            desc: '',
                                            path: event.value + event.ext,
                                            name: event.fname
                                        },
                                        auth: {
                                            src: ResourceSrc.PUBLIC
                                        }
                                    });
                                    event.url = `/data/${event.value}`;
                                }
                            });
                        }
                        jointIOStr('inputs');
                        jointIOStr('outputs');
                        jointIOStr('parameters');
                        return Promise.map(geodata, doc => {
                            return new Promise((resolve, reject) => {
                                geoDataDB.insert(doc)
                                    .then(v => {
                                        return resolve(true);
                                    })
                                    .catch(e => {
                                        return resolve(false);
                                    })
                            });
                        })
                            .then(rsts => {
                                return Promise.resolve({
                                    runned: false,
                                    ioStr: ioStr
                                })
                            })
                    }
                })
                .then(obj => {
                    if (obj.runned) {
                        // 此处应该在前台动态验证，如果标准数据集中的数据已经计算过了，则不参与计算，直接重定向到运行记录
                        msInstance.state = CalcuTaskState.FINISHED_SUCCEED;
                        msInstance.progress = 100;
                        calcuTaskDB.update({ _id: msInstance._id }, msInstance)
                            .then(rst => {
                                return resolve(msInstance._id);
                            });
                    }
                    else {
                        let ioStr = obj.ioStr;
                        let cmdLine = `${ms.exeName} ${ioStr}`;
                        let cwd = path.join(setting.geo_models.path, ms.path);
                        let group = _.filter(cmdLine.split(/\s+/), str => str.trim() !== '');
                        console.log(cmdLine);
                        let updateRecord = (type, progress?) => {
                            if (progress) {
                                msInstance.progress = progress;
                                msInstance.state = progress >= 100 ? CalcuTaskState.FINISHED_SUCCEED : CalcuTaskState.RUNNING;
                            }
                            else {
                                msInstance.state = type === 'succeed' ? CalcuTaskState.FINISHED_SUCCEED : CalcuTaskState.FINISHED_FAILED;
                                msInstance.progress = type === 'succeed' ? 100 : -1;
                            }

                            calcuTaskDB.update({ _id: msInstance._id }, msInstance);
                        }
                        // TODO 管道的写法，提取出进度条
                        const cp = spawn(group[0], group.slice(1), {
                            cwd: cwd
                        });
                        cp.stdout.on('data', data => {
                            let str = data.toString();
                            if (str.indexOf(setting.invoke_failed_tag) !== -1) {
                                updateRecord('failed');
                            }
                            else {
                                // 更新 process
                                let group = str.match(setting.progressReg);
                                let progress = group ? group[group.length - 1] : undefined;
                                if (progress) {
                                    console.log(progress);
                                    updateRecord(undefined, parseFloat(progress));
                                }
                            }
                        });
                        cp.stderr.on('data', data => {
                            // 
                            console.log(data.toString());
                            updateRecord('failed');
                        });
                        cp.on('close', code => {
                            console.log(code);
                            if (code === 0) {
                                console.log('run finished!');
                                updateRecord('succeed');
                            }
                            else {
                                updateRecord('failed');
                            }
                        });

                        // exec(cmdLine, {
                        //     cwd: cwd
                        // }, (err, stdout, stderr) => {

                        //     if (err) {
                        //         console.log(err);
                        //         updateRecord('failed');
                        //     }
                        //     if (stdout.indexOf(setting.invoke_failed_tag) !== -1) {
                        //         updateRecord('failed');
                        //     }
                        //     else {
                        //         updateRecord('succeed');
                        //     }
                        // });

                        msInstance.progress = 0.0001;
                        return calcuTaskDB.update({ _id: msInstance._id }, msInstance)
                            .then(rst => {
                                return resolve(msInstance._id);
                            });
                    }
                })
            // .catch(e => {
            //     console.log(e);
            // });
        });
    }
}
