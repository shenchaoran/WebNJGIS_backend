import { Response, Request, NextFunction } from 'express';
import * as Promise from 'bluebird';
import * as _ from 'lodash';
const xpath = require('xpath');
const dom = require('xmldom').DOMParser;
import { ObjectID } from 'mongodb';

import * as RequestCtrl from './request.controller';
import { setting } from '../config/setting';
import DataCtrl from '../controllers/data.controller';
import {
    modelServiceDB,
    calcuTaskDB,
    CalcuTaskState,
    geoDataDB,
    ResourceSrc,
    computingNodeDB
} from '../models';
import * as child_process from 'child_process';
const exec = child_process.exec;
const spawn = child_process.spawn;
import * as path from 'path';
import * as StdDataCtrl from './std-data.controller';
import * as NodeCtrl from './computing-node.controller'
import { getByServer, postByServer, PostRequestType } from './request.controller';
const db = modelServiceDB;

export default class ModelService {
    constructor() { }

    /**
     * resolve:
     *      {msrId, code, desc}
     *      code:
     *          200: 调用成功
     *          500: 比较服务器出错
     *          501: 计算服务器出错
     *          503: 计算服务器崩了或 ip 变了
     * reject: 
     * 
     * 调用模型：
     *      插入运行记录
     *      如果 state === START_PENDING 时启动模型实例
     * 
     *      如果使用用户上传的数据时，还要先将数据传过去
     * 
     * @static
     * @param {any} msr 
     * @param {any} type 
     * @returns {Promise<any>} 
     * @memberof ModelService
     */
    static invoke(msr): Promise<any> {
        if (!msr._id) {
            msr._id = new ObjectID()
        }
        let node
        let serverURL
        return calcuTaskDB.upsert({ _id: msr._id }, msr)
            .then(rst => {
                if (CalcuTaskState.INIT === msr.state) {
                    return Promise.resolve(msr._id);
                }
                else if (CalcuTaskState.START_PENDING === msr.state) {
                    // 查找 node 的 host 和 port
                    return NodeCtrl.telNode(msr.ms.nodeId)
                        .then(v => {
                            serverURL = v
                            if (msr.IO.dataSrc === 'UPLOAD') {
                                return DataCtrl.pushData2ComputingServer(msr._id)
                            }
                            else {
                                return
                            }
                        })
                        .then(() => {
                            let invokeURL = `${serverURL}/services/invoke`
                            return postByServer(invokeURL, {
                                calcuTask: msr
                            }, PostRequestType.JSON)
                        })
                        .then(res => {
                            if (res.code === 200) {
                                return Promise.resolve({
                                    msrId: msr._id,
                                    code: 200,
                                    desc: 'start model succeed'
                                })
                            }
                            else {
                                return Promise.resolve({
                                    msrId: msr._id,
                                    code: 501,
                                    desc: 'start model failed, error in calculation server'
                                })
                            }
                        })
                        .catch(e => {
                            console.log(e);
                            if (_.get(e, 'error.code') === 'ECONNREFUSED') {
                                return Promise.resolve({
                                    msrId: msr._id,
                                    code: 503,
                                    desc: 'computing server crash or ip changed, please retry later'
                                })
                            }
                            else {
                                return Promise.resolve({
                                    msrId: msr._id,
                                    code: 500,
                                    desc: 'unpredectable error'
                                })
                            }
                        });
                }
            })
    }
}
