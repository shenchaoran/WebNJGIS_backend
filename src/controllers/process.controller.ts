import { setting } from '../config/setting';
import * as path from 'path';
import * as Bluebird from 'bluebird';
const fs = Bluebird.promisifyAll(require('fs'));
import * as _ from 'lodash';
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
    ProcessQueueModel,
    IProcessQueueDocument,
} from '../models';

// singleton
export default class ProcessCtrl {
    // 已经启动、正在运行的子进程
    child_processes: IProcessQueueDocument[];

    // 最大同时运行的子进程
    // TODO 按照子进程名称列一个详细的 concurrency map
    concurrency: number = 8;
    constructor() {
        if(!(ProcessCtrl as any).instance) {
            this.child_processes = [];
            this.child_processes = new Proxy(this.child_processes, {
                set: (target, property, value, receiver) => {
                    console.log(`******** cmp-process number: ${target.length}`);
                    return Reflect.set(target, property, value, receiver)
                }
            });

            (ProcessCtrl as any).instance = this
        }
        return (ProcessCtrl as any).instance
    }
    
    // 程序崩溃，清理子进程
    async cleanup() {
        try {
            this.child_processes.map(async child_process => {
                process.kill(child_process.pid);
                await TaskModel.updateOne(child_process.condition, {
                    $set: { 
                        [`${child_process.updatePath}.state`]: OGMSState.FINISHED_FAILED,
                        [`${child_process.updatePath}.result`]: null,
                    }
                })
                console.log(`******** clean db success: ${child_process}`)
                _.remove(this.child_processes, cp => cp.pid === child_process.pid)
            })
        }
        catch(e) {
            console.error('error in cleanup child-process: ', e)
        }
    }

    // 添加子进程 id
    async add(cmpProcess: IProcessQueueDocument) {
        if(!_.find(this.child_processes, child_process => child_process.pid === cmpProcess.pid)) {
            console.log(`******** add started child_process record`, cmpProcess)
            console.log(this.child_processes)
            this.child_processes.push(cmpProcess)
        }
    }

    // 删除子进程 id
    async remove(pid) {
        let removed = _.remove(this.child_processes, child_process => child_process.pid === pid);
        return removed;
    }

    // 添加比较任务到队列
    async push(taskId, cmpObjId, methodId, rightNow=false) {
        if(this.child_processes.length < this.concurrency || rightNow) {
            postal.channel('child-process').publish('start', { taskId, cmpObjId, methodId })
        }
        else {
            ProcessQueueModel.insert({
                taskId,
                cmpObjId,
                methodId
            })
        }
    }

    // 取队头任务开启运行
    async shift() {
        if(this.child_processes.length < this.concurrency) {
            let process = await ProcessQueueModel.findOneAndRemove({}, { sort: {_id: 1} });
            if(process)
                postal.channel('child-process').publish('start', process)
        }
    }

    async shutdown(taskId, cmpObjId, methodId) {
        try {
            console.log(this.child_processes)
            let cp = _.find(this.child_processes, cp => {
                return cp.taskId === taskId && cp.cmpObjId === cmpObjId && cp.methodId === methodId
            }) as IProcessQueueDocument
            if(cp) {
                process.kill(cp.pid)
                console.log(`******** shutdown: pid-${cp.pid}-methodId-${methodId}-taskId-${cmpObjId}-cmpObjId-${taskId}`)
                this.remove(cp.pid)
                await TaskModel.update(cp.condition, {
                    $set: { 
                        [`${cp.updatePath}.state`]: OGMSState.FINISHED_FAILED,
                        [`${cp.updatePath}.result`]: null,
                    }
                })
            }
        }
        catch(e) {
            console.error(e)
        }
    }

    async restart(taskId, cmpObjId, methodId) {
        try {
            await this.shutdown(taskId, cmpObjId, methodId)
            this.push(taskId, cmpObjId, methodId)
        }
        catch(e) {
            console.error(e)
        }
    }
}

const processCtrl = new ProcessCtrl()

process.on('uncaughtException', (error: any) => {
    console.error('uncaughtException', error)
})

process.on('unhandledRejection', (error: any) => {
    console.error('unhandledRejection', error)
})

process.on('exit', async code => {
    await processCtrl.cleanup()
    console.log(`******** exit: ${code}`)
})

process.once('SIGTERM', async () => {
    await processCtrl.cleanup()
    console.log(`******** SIGTERM`)
    process.exit(0)
})


process.once('SIGINT', async () => {
    await processCtrl.cleanup()
    console.log(`******** SIGINT`)
    process.exit(0)
})

