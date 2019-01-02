import { UDXSchema } from './../../models/UDX-schema.class';
import { DataRefer } from '../../models/solution.model';
import * as Bluebird from 'bluebird';
import * as EventEmitter from 'events';
import { start } from 'repl';

export default class CmpMethod extends EventEmitter implements ICmpMethod {
    result;
    constructor(public dataRefers: DataRefer[], public schemas: UDXSchema[]) {
        super()
    }

    public start() {}
}

export interface ICmpMethod {
    // emit 'afterCmp' event when have finished the comparison
    start;
}