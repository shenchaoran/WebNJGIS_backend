import { Response, Request, NextFunction } from 'express';
import * as formidable from 'formidable';
import * as Promise from 'bluebird';
import * as _ from 'lodash';
import * as path from 'path';
import * as fs from 'fs';

import { issueDB } from '../models';
import { solutionDB } from '../models/solution.model';

const db = issueDB;

export default class IssueCtrl {
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
     *      issue: Issue,
     *      conversation: Conversation 
     * }
     */
    findOne(id) {
        return issueDB.findOne({_id: id})
            .then(this.expand)
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
    addIssue(issue) {
        return issueDB.insert(issue)
            .then(v => true)
            .catch(e => {
                console.log(e);
                return false;
            })
    }

    /**
     * @return true/false
     */
    deleteIssue(issueId) {
        return issueDB.remove({_id: issueId})
            .then(v => true)
            .catch(e => {
                console.log(e);
                return false;
            });
    }

    /**
     * @return true/false
     */
    updateIssue(issue) {
        return issueDB.update(
            {
                _id: issue._id
            },
            {
                $set: issue
            }
        )
        .then(v => true)
        .catch(e => {
            console.log(e);
            return false;
        })
    }
}