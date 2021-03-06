import * as formidable from 'formidable';
import * as Bluebird from 'bluebird';
import * as _ from 'lodash';
import * as path from 'path';
const fs = Bluebird.promisifyAll(require('fs'));
import { setting } from '../config/setting';
import { ObjectID } from 'mongodb';
import * as mongoose from 'mongoose';
import RefactorCtrl from './refactor.controller';
import { UDXCfg } from '../models/UDX-cfg.class';
import CalcuTaskCtrl from './calcu-task.controller';
import ModelServiceCtrl from './model-service.controller';
import * as postal from 'postal';
import {
    TaskModel,
    SolutionModel,
    TopicModel,
    ModelServiceModel,
    CalcuTaskModel,
    ICalcuTaskDocument,
    OGMSState,
    SchemaName,
    MetricModel,
    CmpObj,
    ObsSiteModel,
} from '../models';
import { ResourceSrc } from '../models/resource.enum';
import ProcessCtrl from './process.controller';
import SolutionCtrl from './solution.controller';

let processCtrl = new ProcessCtrl();
const solutionCtrl = new SolutionCtrl();
const calcuTaskCtrl = new CalcuTaskCtrl();

export default class CmpTaskCtrl {
    constructor() { }
    async insert(doc: any) {
        return TaskModel
            .insert(doc)
            .then(_doc => {
                return Bluebird.resolve(_doc._id.toString());
            })
            .catch(Bluebird.reject);
    };

    async findByPages(pageOpt) {
        let queryTasks
        if (pageOpt.userId === undefined) {
            queryTasks = () => TaskModel.findByPages({}, pageOpt)
        } else {
            queryTasks = () => TaskModel.findByUserId(pageOpt.userId)
        }
        let {count, docs} = await queryTasks()
        let tasks = []
        _.map(docs, doc => {
            let task = _.pick(doc._doc, ['_id', 'meta', 'auth', 'state'])
            let initCmp = 0,
                runningCmp = 0,
                succeedCmp = 0,
                failedCmp = 0;
            _.chain(doc._doc)
                .get('refactored')
                .map(refactored => {
                    _.map(refactored.methods, method => {
                        if(method.state === OGMSState.FINISHED_SUCCEED) {
                            succeedCmp++;
                        }
                        else if(method.state === OGMSState.FINISHED_FAILED) {
                            failedCmp++;
                        }
                        else if(method.state === OGMSState.RUNNING) {
                            runningCmp++;
                        }
                        else if(!method.state) {
                            initCmp++;
                        }
                    })
                })
                .value();
            
            _.set(task, 'initCmp', initCmp)
            _.set(task, 'runningCmp', runningCmp)
            _.set(task, 'succeedCmp', succeedCmp)
            _.set(task, 'failedCmp', failedCmp)
            _.set(task, 'totalCmp', initCmp + runningCmp + succeedCmp + failedCmp)
            // let opt = {}
            // _.set(task, 'chartOption', opt)
            tasks.push(task)
        })
        return {count, docs: tasks}
    }

    /**
     * @returns 
     *      ARTICLE:
     *          READ:   { task, solution, ptMSs }
     *          WRITE:  { mss, methods }
     *      SIDER:
     *          READ:   { ptTopic, ptTasks, participants }
     *          WRITE:  { topics }
     *
     * @param {*} id
     * @param {('article' | 'sider')} type
     * @memberof SolutionCtrl
     */
    detailPage(id, type: 'ARTICLE' | 'SIDER', mode: 'READ' | 'WRITE') {

    }

    async findOne(id: string) {
        try {
            let task = await TaskModel.findOne({ _id: id })
            let [solution, calcuTasks, metrics] = await Bluebird.all([
                SolutionModel.findOne({ _id: task.solutionId }),
                CalcuTaskModel.findByIds(task.calcuTaskIds),
                MetricModel.find({}),
            ]);
            let ptMSs = await ModelServiceModel.findByIds(solution.msIds);

            // for(let cmpObj of task.cmpObjs) {
            //     for( let method of task.cmpMethods) {
            //         if(
            //             method.name === 'Bias contour map' ||
            //             method.name === 'Taylor diagram' ||
            //             method.name === 'Box diagram' ||
            //             method.name === 'Scatter diagram'
            //         ) {

            //         }
            //         else if(
            //             (method.name === 'Heat map' || 
            //             method.name === 'Sub-region line chart' || 
            //             method.name === 'table series visualization' ||
            //             method.name === 'Line chart') 
            //             // method.result
            //         ) {
            //             // let opt = await fs.readFileAsync(path.join(setting.geo_data.path, method.result), 'utf8')
            //             // method.result = JSON.parse(opt);
            //         }
            //     }
            // }
            return { task, solution, ptMSs, calcuTasks, metrics, }
        }
        catch (e) {
            console.error(e);
            return Bluebird.reject(e);
        }
    };

    /**
     * deprecated
     * 根据taskId和请求的数据类型返回cmp-data的详情
     * 没有直接放在task中是因为太大了
     */
    async getCmpResult(taskId, cmpObjId, msId) {
        let cmpRst;
        return TaskModel.findOne({ _id: taskId })
            .then(task => {
                _.map(task.cmpObjs as any[], cmpObj => {
                    if (cmpObj.id === cmpObjId) {
                        _.map(cmpObj.dataRefers as any[], dataRefer => {
                            if (dataRefer.msId === msId) {
                                if (dataRefer.cmpResult) {
                                    cmpRst = {
                                        cmpObjId: cmpObj.id,
                                        msId: dataRefer.msId,
                                        done: true,
                                        cmpResult: dataRefer.cmpResult
                                    };
                                }
                                else {
                                    cmpRst = {
                                        cmpObjId: cmpObj.id,
                                        msId: dataRefer.msId,
                                        done: false
                                    };
                                }
                            }
                        });
                    }
                });
                return Bluebird.resolve(cmpRst);
            })
            .catch(Bluebird.reject);
    };


    /**
     * 返回标准结果，目前没有标准结果集，只能返回和计算结果相同的数据
     *      table数据返回table
     *      ascii grid 数据返回 cmpResult-> image里的结构
     *      statistic 返回 hot table 的数据源
     */
    async getStdResult(cmpTaskId) {
        const stdResult = [];
        return TaskModel.findOne({ _id: cmpTaskId })
            .then(task => {
                // TODO
                _.map(task.cmpObjs as any[], cmpObj => {
                    _.map(cmpObj.methods as any[], method => {

                    });
                });

            })
            .catch(Bluebird.reject);
    }

    // 测试用
    async createTaskByIndex(siteIndex: Number, slnId: String) {
        try {
            let { solution, ptMSs, stds, } = await solutionCtrl.createTask(slnId)
            let site = await ObsSiteModel.findOne({index: siteIndex})
            let task = (TaskModel as any).ogms_constructor((process as any).administrator, solution)
            task.state = OGMSState.COULD_START;
            task.cmpMethods = solution.cmpMethods;
            task.temporal = solution.temporal;
            task.meta.name = `${siteIndex}`;
            task.meta.desc = 'auto-create by admin for batch test, GPP, 8 day interval';
            task.sites = [site];
            task.solutionId = solution._id.toString();
            task.topicId = solution.topicId;
            task.calcuTaskIds = [];
    
            let calcuTasks = ptMSs.map(ms => {
                let calcuTask = (CalcuTaskModel as any).ogms_constructor((process as any).administrator, ms)
                task.calcuTaskIds.push(calcuTask._id.toString());
                calcuTask.meta.name = `${siteIndex}`;
                calcuTask.meta.desc = 'auto-create by admin for batch test, GPP, 8 day interval'
                calcuTask.state = OGMSState.COULD_START;
                calcuTask.IO.std.map(event => {
                    if(event.id === '--dataset')
                        event.value = '5b9012e4c29ca433443dcfab'
                    else if(event.id === '--index')
                        event.value = siteIndex
                })
                return calcuTask
            });
            task.cmpObjs.map(cmpObj => {
                calcuTasks.map(msr => {
                    let dr = cmpObj.dataRefers.find(dr => dr.type === 'simulation' && dr.msId === msr.msId.toString() && !dr.msrId);
                    dr.msrId = msr._id.toString();
                    dr.msrName = msr.meta.name;
                });
            });
    
            let rsts = await Bluebird.all([
                taskCtrl.insert(task),
                calcuTaskCtrl.insertMany(calcuTasks),
            ])
            let cmpTaskId = rsts[0]
            return cmpTaskId
        }
        catch(e) {
            e
        }
    }

    // 测试用
    async startByIndex(siteIndex: Number, slnId: String) {
        try {
            let taskId = await taskCtrl.createTaskByIndex(siteIndex, slnId)
            console.log(`${siteIndex}`)
            return taskCtrl.startInBackground(taskId);
        }
        catch(e) {
            e
        }
    }

    async start(cmpTaskId) {
        try {
            this.startInBackground(cmpTaskId);
            return Bluebird.resolve({
                code: 200,
                desc: 'Start comparison task in background!'
            });
        }
        catch (e) {
            console.error(e)
        }
    }

    private async startInBackground(cmpTaskId) {
        try {
            let task = await this.invokeAndCache(cmpTaskId);
            let refactorCtrl = new RefactorCtrl(task);
            task = await refactorCtrl.refactor();
            return new Promise((resolve, reject) => {
                let count = 0, sum = 0;
                postal.channel(task._id).subscribe('cmp-method', ({metricName, methodName}) => {
                    count++;
                    if(count === sum) {
                        TaskModel.updateOne({_id: task._id}, {$set: {state: OGMSState.FINISHED_SUCCEED}})
                            .then(msg => {
                                resolve()
                            })
                    }
                })
                
                // TODO 如果 isAllSTDCache && 有缓存的话直接返回
                task.refactored.map(refactored => {
                    task.cmpMethods.map(method => {
                        processCtrl.push(task._id, refactored.metricName, method.name)
                        sum++;
                    })
                })

            })
        }
        catch(e) {
            console.error(e);
        }
    }

    private async invokeAndCache(cmpTaskId) {
        try {
            await TaskModel.updateOne({ _id: cmpTaskId }, { $set: { state: OGMSState.RUNNING } })
            let task = await TaskModel.findOne({ _id: cmpTaskId });
            let calcuTasks = await Bluebird.map(task.calcuTaskIds, calcuTaskId => {
                if(!calcuTaskId) {
                    console.log(task._id.toString())
                    console.log(task.calcuTaskIds)
                }
                return new Bluebird((resolve, reject) => {
                    let msCtrl = new ModelServiceCtrl()
                    msCtrl.invoke(calcuTaskId.toString()).catch(reject)
                    postal.channel(calcuTaskId).subscribe('onModelFinished', msg => {
                        if(msg.code !== 200) {
                            resolve(undefined);
                        }
                    })
                    postal.channel(calcuTaskId).subscribe('afterDataBatchCached', async msg => {
                        if(msg.code === 200) {
                            let calcuTask = await CalcuTaskModel.findOne({ _id: calcuTaskId })
                            resolve(calcuTask);
                        }
                        else {
                            // 数据缓存失败的不参与对比，但是也不能影响其他模型对比的流程
                            resolve(undefined);
                        }
                    })
                })
            }, { concurrency: 10 })
            calcuTasks = calcuTasks.filter(v => !!v);
            task.cmpObjs.map(cmpObj => {
                cmpObj.dataRefers.map(dataRefer => {
                    let msr = (calcuTasks as any[]).find(msr => msr._id.toHexString() === dataRefer.msrId);
                    if (msr) {
                        if(msr.cachedPosition === 'STD') {
                            if(dataRefer.type === 'simulation') {
                                let index = _.find(msr.IO.std, std => std.id === '--index').value;
                                if(dataRefer.eventId === '--do' || dataRefer.eventId === '--outfile') {
                                    if(dataRefer.msName === 'IBIS site') {
                                        dataRefer.value = `${index}.daily.txt`
                                    }
                                    else if(dataRefer.msName === 'Biome-BGC site') {
                                        dataRefer.value = `${index}.daily.ascii`
                                    }
                                    else if(dataRefer.msName === 'LPJ site') {
                                        dataRefer.value = `${index}.daily.csv`
                                    }
                                }
                                else if(dataRefer.eventId === '--ao') {
                                    if(dataRefer.msName === 'IBIS site') {
                                        dataRefer.value = `${index}.annual.txt`
                                    }
                                    else if(dataRefer.msName === 'Biome-BGC site') {
                                        dataRefer.value = `${index}.annual.ascii`
                                    }
                                }
                                dataRefer.datasetId = _.find(msr.IO.std, std => std.id === '--dataset').value;
                                dataRefer.cachedPosition = 'STD'
                            }
                        }
                        else {
                            for (let key in msr.IO) {
                                if (key === 'inputs' || key === 'outputs' || key === 'parameters') {
                                    let event = msr.IO[key].find(event => event.id === dataRefer.eventId)
                                    if (event) {
                                        dataRefer.cachedPosition = 'DB'
                                        dataRefer.value = event.value
                                    }
                                }
                            }
                        }
                    }
                })
            })
            await TaskModel.updateOne({ _id: task._id }, { $set: task })
            return task;
        }
        catch(e) {
            console.error(e)
            return Bluebird.reject(e)
        }
    }

    async startOneCmpMethod(cmpTaskId, metricName, methodName, type) {
        if(type === 'start') {
            this.invokeAndCache(cmpTaskId).then(task => {
                processCtrl.push(cmpTaskId, metricName, methodName)
            })
        }
        else if(type === 'restart') {
            processCtrl.restart(cmpTaskId, metricName, methodName)
        }
        else if(type === 'stop') {
            processCtrl.shutdown(cmpTaskId, metricName, methodName)
        }
        return true;
    }

    async hadFinished(taskId) {
        try {
            let task = await TaskModel.findOne({_id: taskId})
            let state = OGMSState.FINISHED_SUCCEED
            if(!task.refactored)
                return false
            for(let item of task.refactored) {
                for(let method of item.methods) {
                    if(method.state !== OGMSState.FINISHED_FAILED && method.state !== OGMSState.FINISHED_SUCCEED) {
                        state = OGMSState.RUNNING
                        break
                    }
                }
                if(state === OGMSState.RUNNING)
                    break
            }
            await TaskModel.updateOne({_id: taskId}, {$set: {state}})
            return state === OGMSState.FINISHED_SUCCEED
        }
        catch(e) {
            console.error(e)
            return Bluebird.reject(e)
        }
    }
}

const taskCtrl = new CmpTaskCtrl();