import { UDXSchema } from './../../models/UDX-schema.class';
import { DataRefer } from './../../models/cmp-solution.model';
import * as Bluebird from 'bluebird';

export default class CmpMethod {
    result;
    afterCmp: Function = () => {};
    constructor(public dataRefers: DataRefer[], public schemas: UDXSchema[], lifeCycles?: {
        afterCmp?: Function
    }) {
        Object.assign(this, lifeCycles)
    }

    async start(): Promise<any> {
        
    }
}