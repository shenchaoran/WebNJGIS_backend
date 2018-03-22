/**
 * 和数据实体性关联。由于UDX脱离了MDL后不清楚其内部结构，所以附加一个cfg文件解释其结构
 */

import * as _ from 'lodash';
import { UDXSchema } from '../models/UDX-schema.class';

import { ResourceSrc } from './resource.enum';

export class UDXCfg {
    entrance?: string;
    entries?: string[];
    desc?: string;
    schema$?: UDXSchema;

    constructor() {
        this.entrance = undefined;
        this.entries = [];
        this.desc = undefined;
        this.schema$ = undefined;
    }
}