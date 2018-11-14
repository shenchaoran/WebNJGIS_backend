// 比较的总控制中心，控制模型的开始调用，请求模型的完成进度，请求模型的结果数据，比较这些数据
import { Response, Request, NextFunction } from 'express';
import * as formidable from 'formidable';
import * as Bluebird from 'bluebird';
import * as _ from 'lodash';
import * as path from 'path';
import * as fs from 'fs';

import { UDXCfg } from '../models/UDX-cfg.class';
import { SchemaName } from '../models/UDX-schema.class';
import { TopicModel, SolutionModel, TaskModel, ModelServiceModel, ResourceSrc, CmpMethodModel, ConversationModel, StdDataModel } from '../models';
import ConversationCtrl from './conversation.controller';
import TopicCtrl from './topic.controller';
const conversationCtrl = new ConversationCtrl();

export default class SolutionCtrl {
    constructor() { }

    /**
     * @returns 
     *      ARTICLE:
     *          READ:   { solution, ptMSs, ptMethods }
     *          WRITE:  { mss, methods }
     *      SIDER:
     *          READ:   { ptTopic, ptTasks, participants }
     *          WRITE:  { topics }
     *
     * @param {*} id
     * @param {('article' | 'sider')} type
     * @memberof SolutionCtrl
     */
    detailPage(id, type: 'ARTICLE' | 'SIDER', mode: 'READ' | 'WRITE') {

    }

    /**
     *
     *
     * @param {*} sid
     * @returns { solution, topic, topicList, tasks, mss, ptMSs, conversation, commentCount, users, cmpMethods }
     * @memberof SolutionCtrl
     */
    async findOne(sid) {
        try {
            let solution = await SolutionModel.findOne({ _id: sid });
            return Bluebird.all([
                solution.topicId ? TopicModel.findOne({ _id: solution.topicId }) : null,
                solution.taskIds ? TaskModel.findByIds(solution.taskIds) : [],
                ModelServiceModel.find({}),
                CmpMethodModel.find({}),
                TopicModel.find({}),
            ])
                .then(([topic, tasks, mss, cmpMethods, topicList]) => {
                    let ptMSs = mss.filter(ms => _.includes(solution.msIds, ms._id.toString()))
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
            let solution = await SolutionModel.findOne({ _id: sid });
            return Bluebird.all([
                solution.msIds && solution.msIds.length ?
                    ModelServiceModel.findByIds(solution.msIds) :
                    [],
                StdDataModel.find({}),
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

    async findByPages(pageOpt: {
        pageSize: number,
        pageIndex: number,
        userId: string,
    }) {
        if (pageOpt.userId === undefined) {
            return SolutionModel.findByPages({}, {
                pageSize: pageOpt.pageSize,
                pageIndex: pageOpt.pageIndex
            })
        } else {
            return SolutionModel.findByUserId(pageOpt.userId).catch(Bluebird.reject);
        }

    }

    insert(doc) {
        return SolutionModel.insert(doc)
            .then(v => true)
            .catch(e => {
                console.log(e);
                return false;
            })
    }

    updateOne(doc) {
        return SolutionModel.updateOne(
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

    /**
     * @returns { docs: MS[] }
     */
    async updatePts(solutionId, ids) {
        try {
            await SolutionModel.updateOne({ _id: solutionId }, {
                $set: {
                    msIds: ids
                }
            });
            let mss = await ModelServiceModel.findByIds(ids);
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
        return SolutionModel.updateOne({ _id: solution._id }, {
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
    async patchTopicId(solutionId, ac, topicId) {
        if (ac === 'addTopic') {
            SolutionModel.updateOne({ _id: solutionId }, {
                $addToSet: {
                    topicIds: topicId
                }
            })
                .then(rsts => true)
                .catch(e => {
                    console.log(e);
                    return false;
                })
        }
        else if (ac === 'removeTopic') {
            SolutionModel.updateOne({ _id: solutionId }, {
                $pull: {
                    topicIds: topicId
                }
            })
                .then(rsts => true)
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
        return CmpMethodModel.findOne({ _id: method.id }) as any
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