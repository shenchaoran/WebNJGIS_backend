import { TaskModel, ITaskDocument, ISchemaDocument, OGMSState, DataRefer } from './../../models';
import * as Bluebird from 'bluebird';
import * as EventEmitter from 'events';
import * as child_process from 'child_process';
import { setting } from '../../config/setting';
import ProcessCtrl from '../process.controller';
import * as postal from 'postal';
let processCtrl = new ProcessCtrl()
import * as _ from 'lodash';

// TODO 加并行限制，一次能运行多少个脚本，其他脚本放在任务队列中
export default class CmpMethod extends EventEmitter implements ICmpMethod {
    result;
    updatePath;
    constructor(
        public task: ITaskDocument, 
        public metricName, 
        public methodName,
    ) {
        super()
    }

    public start() {}

    protected async _start(interpretor, argv, cb) {
        try {
            let {code, stdout, stderr} = await new Bluebird(async (resolve, reject) => {
                let i = _.findIndex(this.task.refactored, item => item.metricName === this.metricName)
                let j = _.findIndex(this.task.refactored[i].methods, item => item.name === this.methodName)    
                const cp = child_process.spawn(interpretor, argv)
                let condition = { _id: this.task._id };
                this.updatePath = `refactored.${i}.methods.${j}`;
                // console.log(`******** start ${this.methodName}`)
                // console.log(`******** pid: ${cp.pid}`)
                processCtrl.add({
                    pid: cp.pid,
                    condition,
                    updatePath: this.updatePath,
                    taskId: this.task._id.toString(),
                    metricName: this.metricName,
                    methodName: this.methodName,
                } as any)
                await this.updateProgress(undefined, OGMSState.RUNNING)

                let stdout = '',
                    stderr = '';
                cp.stdout.on('data', data => {
                    // update progress
                    let output = data.toString()
                    stdout += output;
                    // console.log(output);
                    try {
                        let group = output.match(setting.progressReg);
                        let progress = group? group[1]: undefined;
                        if(progress) {
                            console.log('******** ', this.methodName, 'progress: ', progress);
                            this.updateProgress(progress, OGMSState.RUNNING)
                        }
                    }
                    catch(e) {

                    }
                });
                cp.stderr.on('data', data => {
                    let output = data.toString()
                    stderr += output;
                    console.error(`${interpretor} script error:`, output)
                })
                cp.on('close', code => {
                    if(code !== 0) {
                        console.error(`******** ${code} : ${this.methodName} exit code`);
                        console.log(stdout)
                        console.log(stderr)
                    }
                    else {
                        console.log(`******** ${code} : ${this.methodName} exit code`);
                    }
                    processCtrl.remove(cp.pid);
                    processCtrl.shift();
                    resolve({code, stdout, stderr})
                })
            })
            postal.channel(this.task._id).publish('cmp-method', {
                metricName: this.metricName,
                methodName: this.methodName
            })
            if(stderr.trim() !== '')
                console.error(stderr)
            // console.log(stdout)
            if(code === 0) {
                try {
                    let isSucceed = await cb(stdout)
                    if(isSucceed) {
                        await this.updateProgress(100, OGMSState.FINISHED_SUCCEED)
                        await this.updateResult()
                    }
                    else {
                        await this.updateProgress(null, OGMSState.FINISHED_FAILED)
                    }
                    return ;
                }
                catch(e) {
                    console.error(e)
                    // return Bluebird.reject(e)
                }
            }
            else {
                await this.updateProgress(undefined, OGMSState.FINISHED_FAILED)
            }
        }
        catch(e) {
            postal.channel(this.task._id).publish('cmp-method', {
                metricName: this.metricName,
                methodName: this.methodName
            })
            console.error(e)
        }
    }

    public async updateResult() {
        try {
            await TaskModel.updateOne({ _id: this.task._id }, {
                $set: { [`${this.updatePath}.result`]: this.result }
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
                updateFields[`${this.updatePath}.state`] = state
            if(progress)
                updateFields[`${this.updatePath}.progress`] = progress
            await TaskModel.updateOne({ _id: this.task._id }, { $set: updateFields })
            return { code: 200 }
        }
        catch (e) {
            console.error(e)
        }
    }
}

export interface ICmpMethod {
    // emit 'updateResult' event when have finished the comparison
    start;
}