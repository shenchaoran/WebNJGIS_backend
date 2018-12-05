import { TaskModel, UDXSchema } from './../../models';
import { DataRefer } from '../../models/solution.model';
import * as Bluebird from 'bluebird';
import * as EventEmitter from 'events';
import { start } from 'repl';

export default class CmpMethod extends EventEmitter implements ICmpMethod {
    result;
    cmpMethodName;
    get finishMessage() { return `****** ${this.cmpMethodName} finished`};
    constructor(public dataRefers: DataRefer[], public schemas: UDXSchema[]) {
        super()
    }

    public start() {}

    public async afterCmp(taskId, cmpObjIndex, methodIndex) {
        try {
            await TaskModel.updateOne({ _id: taskId }, {
                $set: { [`cmpObjs.${cmpObjIndex}.methods.${methodIndex}.result`]: this.result }
            })
            return { code: 200 }
        }
        catch (e) {
            console.error(e);
            return { code: 500 }
        }
    }
}

export interface ICmpMethod {
    // emit 'afterCmp' event when have finished the comparison
    start;
}