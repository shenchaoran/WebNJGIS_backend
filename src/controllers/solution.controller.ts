// 比较的总控制中心，控制模型的开始调用，请求模型的完成进度，请求模型的结果数据，比较这些数据
import { Response, Request, NextFunction } from 'express';
import * as formidable from 'formidable';
import * as Bluebird from 'bluebird';
import * as _ from 'lodash';
import * as path from 'path';
import * as fs from 'fs';

import { UDXCfg } from '../models/UDX-cfg.class';
import { SchemaName } from '../models/UDX-schema.class';
import * as PropParser from './UDX.property.controller';
import * as UDXComparators from './UDX.compare.controller';
import { topicDB, solutionDB, taskDB, modelServiceDB, ResourceSrc, cmpMethodDB, conversationDB, Solution, stdDataDB } from '../models';
import ConversationCtrl from './conversation.controller';
import TopicCtrl from './topic.controller';
const conversationCtrl = new ConversationCtrl();

export default class SolutionCtrl {
    db = solutionDB;
    constructor() { }

    private expand(doc) { }

    /**
     *
     *
     * @param {*} sid
     * @returns { solution, topic, topicList, tasks, mss, ptMSs, conversation, commentCount, users, cmpMethods }
     * @memberof SolutionCtrl
     */
    async findOne(sid) {
        try {
            let solution = await solutionDB.findOne({ _id: sid });
            return Bluebird.all([
                solution.topicId ? topicDB.findOne({ _id: solution.topicId }) : null,
                solution.taskIds ? taskDB.findByIds(solution.taskIds) : [],
                modelServiceDB.find({}),
                solution.cid ? conversationCtrl.findOne({ _id: solution.cid }) : {} as any,
                cmpMethodDB.find({}),
                topicDB.find({}),
            ])
                .then(([topic, tasks, mss, { conversation, users, commentCount }, cmpMethods, topicList]) => {
                    let ptMSs = mss.filter(ms => solution.msIds.includes(ms._id.toString()))
                    return {
                        solution,
                        topic: topic ? {
                            _id: topic._id,
                            meta: topic.meta,
                            auth: topic.auth,
                        } : null,
                        tasks: tasks.map(task => {
                            return {
                                _id: task._id,
                                meta: task.meta,
                                auth: task.auth,
                            };
                        }),
                        ptMSs,
                        mss: mss.map(ms => {
                            return {
                                _id: ms._id,
                                meta: ms.MDL.meta,
                                auth: ms.auth
                            };
                        }),
                        cmpMethods: cmpMethods.map(method => {
                            return {
                                _id: method._id,
                                meta: method.meta,
                            };
                        }),
                        conversation,
                        users,
                        commentCount,
                        topicList: topicList.map(topic => {
                            return {
                                _id: topic._id,
                                meta: topic.meta,
                                auth: topic.auth,
                                solutionIds: topic.solutionIds,
                            };
                        })
                    }
                });
        }
        catch (e) {
            console.log(e);
            return Bluebird.reject(e);
        }
    }

    /**
     * 创建比较任务页面
     *
     * @param {*} sid
     * @returns { Solution, ptMSs,  }
     * @memberof SolutionCtrl
     */
    async createTask(sid) {
        try {
            let solution = await solutionDB.findOne({ _id: sid });
            return Bluebird.all([
                solution.msIds && solution.msIds.length ?
                    modelServiceDB.findByIds(solution.msIds) :
                    [],
                stdDataDB.find({}),
                // solution.cid ? 
                //     conversationCtrl.findOne({ _id: solution.cid }) : 
                //     {} as any,
            ])
                .then(([ptMSs, stds]) => {
                    return {
                        solution,
                        ptMSs,
                        stds,
                    };
                })
        }
        catch (e) {
            console.log(e);
            return Bluebird.reject(e);
        }
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
                .catch(Bluebird.reject);
        } else {
            return this.db.findByUserId(pageOpt.userId).catch(Bluebird.reject);
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
        if (ac === 'subscribe') {
            updatePattern = {
                $addToSet: {
                    subscribed_uids: uid
                }
            };
        }
        else if (ac === 'unsubscribe') {
            updatePattern = {
                $pull: {
                    subscribed_uids: uid
                }
            }
        }
        return this.db.update({ _id: solutionId }, updatePattern)
            .then(v => true)
            .catch(e => {
                console.log(e);
                return false;
            });
    }

    /**
     * @returns { docs: MS[] }
     */
    async updatePts(solutionId, ids) {
        try {
            await this.db.update({ _id: solutionId }, {
                $set: {
                    msIds: ids
                }
            });
            let mss = await modelServiceDB.findByIds(ids);
            return { docs: mss };
        }
        catch (e) {
            return Bluebird.reject(e);
        }
    }

    /**
     * @returns true/false
     */
    async updateCmpObjs(solution) {
        return this.db.update({ _id: solution._id }, {
            $set: solution
        })
            .then(rst => true)
            .catch(e => {
                console.log(e)
                return false;
            });
    }

    /**
     *
     *
     * @param {*} solutionId
     * @param {*} topicId
     * @returns true/false
     * @memberof SolutionCtrl
     */
    async patchTopicId(solutionId, ac, originalTopicId, topicId) {
        if (ac === 'addTopic') {
            return Bluebird.all([
                topicDB.update({_id: topicId}, {
                    $addToSet: {
                        solutionIds: solutionId
                    }
                }),
                originalTopicId? topicDB.update({_id: originalTopicId}, {
                    $pull: {
                        solutionIds: solutionId
                    }
                }): null,
                solutionDB.update({_id: solutionId}, {
                    $set: {
                        topicId: topicId
                    }
                }),
            ])
                .then(rsts => {
                    return true;
                })
                .catch(e => {
                    console.log(e);
                    return false;
                })
        }
        else if (ac === 'removeTopic') {
            return Bluebird.all([
                topicDB.update({_id: topicId}, {
                    $pull: {
                        solutionIds: solutionId
                    }
                }),
                solutionDB.update({_id: solutionId}, {
                    $set: {
                        topicId: null
                    }
                }),
            ])
                .then(rsts => {
                    return true;
                })
                .catch(e => {
                    console.log(e);
                    return false;
                })
        }
    }
}

const expandDoc = (doc): Bluebird<any> => {
    let methods = [];
    _.map(doc.cmpObjs, cmpObj => {
        _.map((cmpObj as any).methods as any[], method => {
            if (methods.findIndex(v => v.id === method.id) === -1) {
                methods.push(method)
            }
        })
    })
    return Bluebird.map(Array.from(methods), method => {
        return cmpMethodDB.findOne({ _id: method.id })
    })
        .then(rsts => {
            doc.methods = rsts;
            return Bluebird.resolve(doc);
        })
        .catch(Bluebird.reject);
}

export const convert2Tree = (user, docs: Array<any>): Bluebird<any> => {
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

    return Bluebird.resolve(trees);
}