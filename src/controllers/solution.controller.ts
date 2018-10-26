// 比较的总控制中心，控制模型的开始调用，请求模型的完成进度，请求模型的结果数据，比较这些数据
import { Response, Request, NextFunction } from 'express';
import * as formidable from 'formidable';
import * as Promise from 'bluebird';
import * as _ from 'lodash';
import * as path from 'path';
import * as fs from 'fs';

import { UDXCfg } from '../models/UDX-cfg.class';
import { SchemaName } from '../models/UDX-schema.class';
import * as PropParser from './UDX.property.controller';
import * as UDXComparators from './UDX.compare.controller';
import { topicDB, solutionDB, taskDB, modelServiceDB, ResourceSrc, cmpMethodDB, conversationDB } from '../models';
import ConversationCtrl from './conversation.controller';
const conversationCtrl = new ConversationCtrl();

export default class SolutionCtrl {
    db = solutionDB;
    constructor() { }

    private expand(doc) { }

    /**
     *
     *
     * @param {*} sid
     * @returns { solution, topic, tasks, mss, conversation, commentCount, users }
     * @memberof SolutionCtrl
     */
    findOne(sid) {
        return solutionDB.findOne({ _id: sid }).then(solution => {
            return Promise.all([
                solution.topicId? topicDB.findOne({_id: solution.topicId}): {} as any,
                solution.taskIds? taskDB.findDocs(solution.taskIds): [],
                solution.msIds? modelServiceDB.findDocs(solution.msIds): [],
                solution.cid? conversationCtrl.findOne({_id: solution.cid}): {} as any,
                solution.participants? modelServiceDB.findDocs(solution.participants): [],
            ])
                .then(([topic, tasks, mss, {conversation, users, commentCount}, participants]) => {
                    solution.participants = participants;
                    return {
                        solution,
                        topic: {
                            _id: topic._id,
                            meta: topic.meta,
                            auth: topic.auth,
                        },
                        tasks: tasks.map(task => {
                            return {
                                _id: task._id,
                                meta: task.meta,
                                auth: task.auth,
                            };
                        }),
                        mss: mss.map(ms => {
                            return {
                                _id: ms._id,
                                meta: ms.MDL.meta,
                                auth: ms.auth
                            };
                        }),
                        conversation,
                        users,
                        commentCount,
                        // participants,
                    }
                })
        })
        .catch(Promise.reject);
    }

    findByPage(pageOpt: {
        pageSize: number,
        pageIndex: number,
        userId: string,
    }) {
        if (pageOpt.userId === undefined) {
            return this.db.findByPage({}, {
                pageSize: pageOpt.pageSize,
                pageIndex: pageOpt.pageIndex
            })
                .catch(Promise.reject);
        } else {
            return this.db.findByUserId(pageOpt.userId).catch(Promise.reject);
        }
        
    }

    insert(doc) {
        return this.db.insert(doc)
            .then(v => true)
            .catch(e => {
                console.log(e);
                return false;
            })
    }

    update(doc) {
        return this.db.update(
            {
                _id: doc._id
            },
            {
                $set: doc
            }
        )
        .then(v => true)
        .catch(e => {
            console.log(e);
            return false;
        })
    }

    patch() {

    }

    subscribeToggle(solutionId, ac, uid) {
        let updatePattern;
        if(ac === 'subscribe') {
            updatePattern = {
                $addToSet: {
                    subscribed_uids: uid
                }
            };
        }
        else if(ac === 'unsubscribe') {
            updatePattern = {
                $pull: {
                    subscribed_uids: uid
                }
            }
        }
        return this.db.update({_id: solutionId}, updatePattern)
            .then(v => true)
            .catch(e => {
                console.log(e);
                return false;
            });
    }
}

const expandDoc = (doc): Promise<any> => {
    let methods = [];
    _.map(doc.cmpObjs, cmpObj => {
        _.map((cmpObj as any).methods as any[], method => {
            if (methods.findIndex(v => v.id === method.id) === -1) {
                methods.push(method)
            }
        })
    })
    return Promise.map(Array.from(methods), method => {
        return cmpMethodDB.findOne({ _id: method.id })
    })
        .then(rsts => {
            doc.methods = rsts;
            return Promise.resolve(doc);
        })
        .catch(Promise.reject);
}

export const convert2Tree = (user, docs: Array<any>): Promise<any> => {
    const trees = {
        public: [{
            type: 'root',
            label: 'Earth\'s carbon cycle model',
            value: undefined,
            id: 'bbbbbbbbb',
            expanded: true,
            items: []
        }],
        personal: undefined
    };
    const publicDocs = _.filter(docs, doc => doc.auth.src === ResourceSrc.PUBLIC);
    let personalDocs = undefined;
    if (user && user.username !== 'Tourist') {
        trees.personal = [{
            type: 'root',
            label: 'Earth\'s carbon cycle model',
            value: undefined,
            id: 'ccccccccccc',
            expanded: true,
            items: []
        }];
        personalDocs = <Array<any>>_.filter(docs, doc => doc.auth.userId === user._id.toString());
        if (personalDocs) {
            _.map(personalDocs, doc => {
                trees.personal[0].items.push({
                    type: 'leaf',
                    label: (<any>doc).meta.name,
                    value: doc,
                    id: (<any>doc)._id
                });
            });
        }
    }
    _.map(publicDocs, doc => {
        trees.public[0].items.push({
            type: 'leaf',
            label: doc.meta.name,
            value: doc,
            id: doc._id
        });
    });

    return Promise.resolve(trees);
}