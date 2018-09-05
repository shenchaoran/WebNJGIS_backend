import { Response, Request, NextFunction } from 'express';
import * as formidable from 'formidable';
import * as Promise from 'bluebird';
import * as _ from 'lodash';
import * as path from 'path';
import * as fs from 'fs';
import { calcuTaskDB, CalcuTaskState, cmpTaskDB } from '../models';
import { ObjectID } from 'mongodb';

export const insertBatch = (docs): Promise<any> => {
    // TODO 结果处理
    _.map(docs as any[], doc => {
        // 删除无关字段
        doc._id = new ObjectID(doc._id);
    });
    return calcuTaskDB.insertBatch(docs);
}
