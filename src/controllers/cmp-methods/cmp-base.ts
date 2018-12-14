import { TaskModel, UDXSchema, CmpState } from './../../models';
import { DataRefer } from '../../models/solution.model';
import * as Bluebird from 'bluebird';
import * as EventEmitter from 'events';
import * as child_process from 'child_process';
import { setting } from '../../config/setting';

export default class CmpMethod extends EventEmitter implements ICmpMethod {
    result;
    cmpMethodName;
    constructor(
        public dataRefers: DataRefer[], 
        public schemas: UDXSchema[], 
        public regions,
        public taskId, 
        public cmpObjIndex, 
        public methodIndex,
    ) {
        super()
    }

    public start() {}

    protected async _start(interpretor, argv, cb) {
        return new Bluebird((resolve, reject) => {
            const cp = child_process.spawn(interpretor, argv)
            let stdout = '',
                stderr = '';
            cp.stdout.on('data', data => {
                // update progress
                let output = data.toString()
                stdout += output;
                let group = output.match(setting.progressReg);
                let progress = group? group[1]: undefined;
                if(progress) {
                    console.log('******', this.cmpMethodName, 'progress: ', progress);
                    this.updateProgress(progress, CmpState.RUNNING)
                }
            });
            cp.stderr.on('data', data => {
                let output = data.toString()
                stderr += output;
                console.error(`${interpretor} script error:`, output)
            })
            cp.on('close', async code => {
                console.log(`${this.cmpMethodName} exit code: ${code}`)
                if(code === 0) {
                    try {
                        await cb(stdout)
                        await this.updateProgress(100, CmpState.FINISHED_SUCCEED)
                        resolve();
                    }
                    catch(e) {
                        console.error(e)
                        reject(e)
                    }
                }
                else {
                    await this.updateProgress(undefined, CmpState.FINISHED_FAILED)
                    reject(stderr)
                }
            })
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
            if(progress)
                updateFields[`cmpObjs.${this.cmpObjIndex}.methods.${this.methodIndex}.state`] = state
            if(state)
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