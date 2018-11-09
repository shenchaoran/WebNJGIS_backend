import { UDXSchema } from './../../models/UDX-schema.class';
import { DataRefer } from '../../models/solution.model';
import * as Bluebird from 'bluebird';
import * as EventEmitter from 'events';

export default class CmpMethod extends EventEmitter {
    result;
    constructor(public dataRefers: DataRefer[], public schemas: UDXSchema[]) {
        super()
    }

    async start(): Promise<any> {
        
    }
}