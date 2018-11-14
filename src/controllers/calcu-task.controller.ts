import { Response, Request, NextFunction } from 'express';
import * as formidable from 'formidable';
import * as Bluebird from 'bluebird';
import * as _ from 'lodash';
import * as path from 'path';
import * as fs from 'fs';
import { CalcuTaskModel, CalcuTaskState, TaskModel, ConversationModel } from '../models';
import { ObjectID } from 'mongodb';
import ConversationCtrl from './conversation.controller';
const conversationCtrl = new ConversationCtrl();

export default class CalcuTaskCtrl {
    constructor() { }

    /**
     * @returns 
     *      ARTICLE:
     *          READ:   { calcuTask, ms }
     *      SIDER:
     *          READ:   { ptTopic, ptTasks, participants }
     *
     * @param {*} id
     * @param {('article' | 'sider')} type
     * @memberof SolutionCtrl
     */
    detailPage(id, type: 'ARTICLE' | 'SIDER', mode: 'READ' | 'WRITE') {

    }

    async findOne(msrId) {
        try {
            let [msr, ] = await Bluebird.all([
                CalcuTaskModel.findOne({ _id: msrId }) as any,
            ]);
            return { msr };
        }
        catch (e) {
            console.log(e);
            return Bluebird.reject(e);
        }
    }

    async insertMany(docs) {
        // TODO 结果处理
        _.map(docs as any[], doc => {
            // 删除无关字段
            doc._id = new ObjectID(doc._id);
        });
        return CalcuTaskModel.insertMany(docs);
    }
}
