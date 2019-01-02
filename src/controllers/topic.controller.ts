import { Response, Request, NextFunction } from 'express';
import * as formidable from 'formidable';
import * as Bluebird from 'bluebird';
import * as _ from 'lodash';
import * as path from 'path';
import * as fs from 'fs';
import { TopicModel, ConversationModel, SolutionModel, IConversationDocument, UserModel } from '../models';
import ConversationCtrl from './conversation.controller';
import SolutionCtrl from './solution.controller';
let conversationCtrl = new ConversationCtrl();

export default class TopicCtrl {
    constructor() { }

    /**
     * @returns 
     *      ARTICLE:    { topic }
     *      SIDER:      
     *          READ:   { ptSolutions, participants }
     *          WRITE:  { solutions }
     *
     * @param {*} id
     * @memberof TopicCtrl
     */
    async detailPage(id, type: 'ARTICLE' | 'SIDER', mode: 'READ' | 'WRITE') {
        if(type === 'ARTICLE') {
            return TopicModel.findById(id);
        }
        else if(type === 'SIDER' && mode === 'READ') {
            let [ptSolutions, participants] = await Bluebird.all([
                SolutionModel.find({
                    topicIds: {
                        $in: [id]
                    }
                }) as any,
                ConversationModel.findOne({pid: id}, {comments: 1})
                    .then((conversation: IConversationDocument) => {
                        let userIds = new Set();
                        conversation.comments.map(v => userIds.add(v.from_uid))
                        return Array.from(userIds);
                    })
                    .then(UserModel.findByIds)
            ])
            return { ptSolutions, participants}
        }
        else if(type === 'SIDER' && mode === 'WRITE') {
            let solutions = await SolutionModel.find()
            return { solutions }
        }
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
        return Bluebird.all([
            TopicModel.findOne({ _id: id }),
            // TODO 这里暂时全部给前端
            SolutionModel.findByPages({}, {
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
            .catch(Bluebird.reject);
    }

    /**
     * @return {docs, count}
     */
    async findByPages(pageOpt: {
        pageSize: number,
        pageIndex: number,
        userId: string,
    }) {
        if (pageOpt.userId === undefined) {
            return TopicModel.findByPages({}, {
                pageSize: pageOpt.pageSize,
                pageIndex: pageOpt.pageIndex
            })
                .catch(Bluebird.reject);
        } else {
            return TopicModel.findByUserId(pageOpt.userId).catch(Bluebird.reject);
        }

    }


    /**
     * @return true/false
     */
    insert(topic) {
        return TopicModel.insert(topic)
            .then(v => true)
            .catch(e => {
                console.error(e);
                return false;
            })
    }

    /**
     * @return true/false
     */
    delete(topicId) {
        return TopicModel.remove({_id: topicId})
            .then(v => true)
            .catch(e => {
                console.error(e);
                return false;
            });
    }

    /**
     * @return true/false
     */
    updateOne(topic) {
        return TopicModel.updateOne(
            {
                _id: topic._id
            },
            {
                $set: topic
            }
        )
            .then(v => true)
            .catch(e => {
                console.error(e);
                return false;
            })
    }

    /**
     * @return true/false
     */
    patchSolutionIds(topicId, ac, solutionId) {
        let newAC = ac === 'addSolution'? 'addTopic': 'removeTopic';
        return new SolutionCtrl().patchTopicId(solutionId, newAC, topicId);
    }
}