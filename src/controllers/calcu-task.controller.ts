import { Response, Request, NextFunction } from 'express';
import * as formidable from 'formidable';
import * as Bluebird from 'bluebird';
import * as _ from 'lodash';
import * as path from 'path';
import * as fs from 'fs';
import { calcuTaskDB, CalcuTaskState, taskDB, conversationDB } from '../models';
import { ObjectID } from 'mongodb';
import ConversationCtrl from './conversation.controller';
const conversationCtrl = new ConversationCtrl();

export default class CalcuTaskCtrl {
    db = calcuTaskDB;
    constructor() { }

    async findOne(msrId) {
        try {
            let [msr, ] = await Promise.all([
                this.db.findOne({ _id: msrId }),
            ]);
            return { msr };
        }
        catch (e) {
            console.log(e);
            return Bluebird.reject(e);
        }
    }

    insertBatch(docs): Bluebird<any> {
        // TODO 结果处理
        _.map(docs as any[], doc => {
            // 删除无关字段
            doc._id = new ObjectID(doc._id);
        });
        return this.db.insertBatch(docs);
    }
}
