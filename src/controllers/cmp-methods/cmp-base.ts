import { TaskModel, ISchemaDocument, OGMSState, DataRefer } from './../../models';
import * as Bluebird from 'bluebird';
import * as EventEmitter from 'events';
import * as child_process from 'child_process';
import { setting } from '../../config/setting';
import ProcessCtrl from '../process.controller';
let processCtrl = new ProcessCtrl()
import * as _ from 'lodash';

// TODO 加并行限制，一次能运行多少个脚本，其他脚本放在任务队列中
export default class CmpMethod extends EventEmitter implements ICmpMethod {
    task;
    result;
    cmpMethodName;
    constructor(
        public dataRefers: DataRefer[], 
        public regions,
        public taskId, 
        public cmpObjIndex, 
        public methodIndex,
    ) {
        super()
    }

    public start() {}

    protected async _start(interpretor, argv, cb) {
        this.task = await TaskModel.findOne({_id: this.taskId})
        return new Bluebird(async (resolve, reject) => {
            try {
                const cp = child_process.spawn(interpretor, argv)
                let condition = { _id: this.taskId },
                    updatePath = `cmpObjs.${this.cmpObjIndex}.methods.${this.methodIndex}`;
                console.log(`******** start ${this.cmpMethodName}`)
                console.log(`******** pid: ${cp.pid}`)
                processCtrl.add({
                    pid: cp.pid,
                    condition,
                    updatePath,
                    taskId: this.taskId.toString(),
                    cmpObjId: _.get(this, `task.cmpObjs.${this.cmpObjIndex}.id`),
                    methodId: _.get(this, `task.cmpObjs.${this.cmpObjIndex}.methods.${this.methodIndex}.id`)
                } as any)
                await this.updateProgress(undefined, OGMSState.RUNNING)

                let stdout = '',
                    stderr = '';
                cp.stdout.on('data', data => {
                    // update progress
                    let output = data.toString()
                    stdout += output;
                    console.log(output);
                    let group = output.match(setting.progressReg);
                    let progress = group? group[1]: undefined;
                    if(progress) {
                        console.log('******** ', this.cmpMethodName, 'progress: ', progress);
                        this.updateProgress(progress, OGMSState.RUNNING)
                    }
                });
                cp.stderr.on('data', data => {
                    let output = data.toString()
                    stderr += output;
                    console.error(`${interpretor} script error:`, output)
                })
                cp.on('close', async code => {
                    console.log(`******** ${this.cmpMethodName} exit code: ${code}`);
                    processCtrl.remove(cp.pid);
                    processCtrl.shift();
                    if(code === 0) {
                        try {
                            await cb(stdout)
                            await this.updateProgress(100, OGMSState.FINISHED_SUCCEED)
                            await this.afterCmp()
                            resolve();
                        }
                        catch(e) {
                            console.error(e)
                            reject(e)
                        }
                    }
                    else {
                        await this.updateProgress(undefined, OGMSState.FINISHED_FAILED)
                        reject(stderr)
                    }
                })
            }
            catch(e) {
                console.error(e)
                return Bluebird.reject(e)
            }
        })
    }

    public async afterCmp() {
        try {
            await TaskModel.updateOne({ _id: this.taskId }, {
                $set: { [`cmpObjs.${this.cmpObjIndex}.methods.${this.methodIndex}.result`]: this.result }
            })
            return { code: 200 }
        }
        catch (e) {
            console.error(e);
            return { code: 500 }
        }
    }

    public async updateProgress(progress, state) {
        try {
            let updateFields = {}
            if(state)
                updateFields[`cmpObjs.${this.cmpObjIndex}.methods.${this.methodIndex}.state`] = state
            if(progress)
                updateFields[`cmpObjs.${this.cmpObjIndex}.methods.${this.methodIndex}.progress`] = progress
            await TaskModel.updateOne({ _id: this.taskId }, { $set: updateFields })
            return { code: 200 }
        }
        catch (e) {
            console.error(e)
        }
    }
}

export interface ICmpMethod {
    // emit 'afterCmp' event when have finished the comparison
    start;
}