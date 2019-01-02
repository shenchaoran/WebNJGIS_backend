// 比较的总控制中心，控制模型的开始调用，请求模型的完成进度，请求模型的结果数据，比较这些数据
import { Response, Request, NextFunction } from 'express';
import * as formidable from 'formidable';
import * as Bluebird from 'bluebird';
import * as _ from 'lodash';
import * as path from 'path';
import * as fs from 'fs';

import { UDXCfg } from '../models/UDX-cfg.class';
import { SchemaName } from '../models/UDX-schema.class';
import { TopicModel, SolutionModel, MetricModel, TaskModel, ModelServiceModel, ResourceSrc, CmpMethodModel, ConversationModel, StdDataModel } from '../models';
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
                solution.topicIds ? TopicModel.findByIds(solution.topicIds) : [],
                TaskModel.find({solutionId: sid}),
                ModelServiceModel.find({}),
                CmpMethodModel.find({}),
                TopicModel.find({}),
                MetricModel.find({}),
            ])
                .then(([attached_topics, tasks, mss, cmpMethods, topicList, metrics]) => {
                    let ptMSs = mss.filter(ms => _.includes(solution.msIds, ms._id.toString()))
                    return {
                        solution,
                        attached_topics: attached_topics.map(topic => {
                            return {
                                _id: topic._id,
                                meta: topic.meta,
                                auth: topic.auth,
                            }
                        }),
                        tasks: tasks.map(task => {
                            return {
                                _id: task._id,
                                meta: task.meta,
                                auth: task.auth,
                            };
                        }),
                        ptMSs,
                        mss: mss.map(ms => {
                            return ms
                            // return {
                            //     _id: ms._id,
                            //     meta: ms.MDL.meta,
                            //     auth: ms.auth
                            // };
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
                        }),
                        metrics,
                    }
                });
        }
        catch (e) {
            console.error(e);
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
                solution.msIds && solution.msIds.length ? ModelServiceModel.findByIds(solution.msIds) :
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
            console.error(e);
            return Bluebird.reject(e);
        }
    }

    async findByPages(pageOpt: {
        pageSize: number,
        pageIndex: number,
        userId: string,
    }) {
        let querySln
        if (pageOpt.userId === undefined) {
            querySln = () => {
                return SolutionModel.findByPages({}, {
                    pageSize: pageOpt.pageSize,
                    pageIndex: pageOpt.pageIndex
                })
            }
        } else {
            querySln = () => {
                return SolutionModel.findByUserId(pageOpt.userId)
            }
        }
        let [{count, docs}, mss] = await Bluebird.all([
            querySln(),
            ModelServiceModel.find({})
        ]);
        let slns = []
        _.map(docs, solution => {
            slns.push(solution._doc)
            _.set(solution, '_doc.mss', [])
            _.map(solution._doc.msIds, msId => {
                let ms = _.find(mss, ms => ms._id.toString() === msId)
                solution._doc.mss.push(
                    _.pick(ms, ['_id', 'MDL.meta', 'auth', ])
                )
            })
        })
        return {count, docs: slns};
    }

    insert(doc) {
        return SolutionModel.insert(doc)
            .then(v => true)
            .catch(e => {
                console.error(e);
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
                console.error(e);
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
                console.error(e)
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
                    console.error(e);
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
                    console.error(e);
                    return false;
                })
        }
    }
}