import { Response, Request, NextFunction } from 'express';
import * as formidable from 'formidable';
import * as Promise from 'bluebird';
import * as _ from 'lodash';
import * as path from 'path';
import * as fs from 'fs';

import { topicDB, conversationDB, solutionDB } from '../models';
import ConversationCtrl from './conversation.controller';
import SolutionCtrl from './solution.controller';
let conversationCtrl = new ConversationCtrl();

const db = topicDB;

export default class TopicCtrl {
    constructor() { }

    private expand(doc): Promise<any> {
        return Promise.all(_.map(doc.solutionIds, slnId => {
            return solutionDB.findOne({ _id: slnId });
        }))
            .then(rsts => {
                if (doc.solutions === undefined) {
                    doc.solutions = [];
                }
                _.map(rsts as any[], rst => {
                    doc.solutions.push({
                        _id: rst._id,
                        meta: rst.meta,
                        auth: rst.auth,
                        mss: rst.cmpCfg.ms
                    });
                });
                return doc;
            })
            .catch(Promise.reject);
    }

    /**
     * @return {
     *      topic: Topic,
     *      conversation: Conversation,
     *      commentCount: number
     *      users: User[],
     * }
     */
    findOne(id) {
        return Promise.all([
            topicDB.findOne({ _id: id }),
            // TODO 这里暂时全部给前端
            solutionDB.findByPage({}, {
                pageSize: 50,
                pageIndex: 1,
            })
        ])
            .then(([
                topic,
                {
                    count: solutionCount,
                    docs: solutions
                },
            ]) => {
                solutions.map(sln => {
                    sln.cmpObjs = null;
                });
                return {
                    topic,
                    solutions,
                    solutionCount,
                };
            })
            .catch(Promise.reject);
    }

    /**
     * @return {docs, count}
     */
    findByPage(pageOpt: {
        pageSize: number,
        pageIndex: number,
        userId: string,
    }): Promise<any> {
        if (pageOpt.userId === undefined) {
            return db.findByPage({}, {
                pageSize: pageOpt.pageSize,
                pageIndex: pageOpt.pageIndex
            })
                .catch(Promise.reject);
        } else {
            return db.findByUserId(pageOpt.userId).catch(Promise.reject);
        }

    }


    /**
     * @return true/false
     */
    insert(topic) {
        return topicDB.insert(topic)
            .then(v => true)
            .catch(e => {
                console.log(e);
                return false;
            })
    }

    /**
     * @return true/false
     */
    delete(topicId) {
        return topicDB.remove({_id: topicId})
            .then(v => true)
            .catch(e => {
                console.log(e);
                return false;
            });
    }

    /**
     * @return true/false
     */
    update(topic) {
        return topicDB.update(
            {
                _id: topic._id
            },
            {
                $set: topic
            }
        )
            .then(v => true)
            .catch(e => {
                console.log(e);
                return false;
            })
    }

    /**
     * @return true/false
     */
    patchSolutionIds(topicId, ac, originalTopicId, solutionId) {
        let newAC = ac === 'addSolution'? 'addTopic': 'removeTopic';
        return new SolutionCtrl().patchTopicId(solutionId, newAC, originalTopicId, topicId);
    }

    /**
     * @return true/false
     */
    subscribeToggle(topicId, ac, uid) {
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
        return topicDB.update({ _id: topicId }, updatePattern)
            .then(v => true)
            .catch(e => {
                console.log(e);
                return false;
            });
    }
}