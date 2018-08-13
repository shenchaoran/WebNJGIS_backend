import { CmpResult } from './cmp-result.class';

export class DataRefer {
    msId: string;
    msName: string;
    eventName: string;
    field?: string;
    dataId?: string;
    cmpResult?: CmpResult;
}