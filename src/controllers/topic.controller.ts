import { Response, Request, NextFunction } from 'express';
import * as formidable from 'formidable';
import * as Promise from 'bluebird';
import * as _ from 'lodash';
import * as path from 'path';
import * as fs from 'fs';

import { topicDB } from '../models';
import { solutionDB } from '../models/solution.model';

const db = topicDB;

export default class TopicCtrl {
    constructor() {}

    private expand(doc): Promise<any> {
        return Promise.all(_.map(doc.solutionIds, slnId => {
            return solutionDB.findOne({ _id: slnId});
        }))
            .then(rsts => {
                if(doc.solutions === undefined) {
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
     *      // conversation: Conversation 
     * }
     */
    findOne(id) {
        return topicDB.findOne({_id: id})
            .then(this.expand)
            .then(v => {
                return {topic: v};
            })
            .catch(Promise.reject);
    }

    /**
     * @return {docs, count}
     */
    findByPage(pageOpt: {
        pageSize: number,
        pageIndex: number
    }): Promise<any> {
        return db.findByPage({}, {
            pageSize: pageOpt.pageSize,
            pageIndex: pageOpt.pageIndex
        })
            .catch(Promise.reject);
    }

    /**
     * @return true/false
     */
    addTopic(topic) {
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
    deleteTopic(topicId) {
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
    updateTopic(topic) {
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
}