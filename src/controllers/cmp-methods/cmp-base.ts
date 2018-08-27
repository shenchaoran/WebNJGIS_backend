import { DataRefer } from './../../models/cmp-solution.model';
import * as Promise from 'bluebird';

export default class CmpMethod {
    constructor(dataRefers: DataRefer[]) {}

    start(): Promise<any> {
        return new Promise((resolve, reject) => {
            
        });
    }
}