import { Response, Request, NextFunction } from 'express';
import * as formidable from 'formidable';
import * as Promise from 'bluebird';
import * as _ from 'lodash';
import * as path from 'path';
import * as fs from 'fs';

import { issueDB } from '../models';
import { solutionDB } from '../models/solution.model';

const db = issueDB;

export default class Issue {
    constructor() {}

    static findByPage(pageOpt: {
        pageSize: number,
        pageIndex: number
    }): Promise<any> {
        return db.findByPage({}, {
            pageSize: pageOpt.pageSize,
            pageIndex: pageOpt.pageIndex
        })
            .then(rst => {
                _.map(rst.docs, Issue.reduceDoc);
                return Promise.resolve(rst);
            })
            .catch(Promise.reject);
    }

    /**
     * @return {
     *      issue: Issue,
     *      conversation: Conversation 
     * }
     */
    static getIssueDetail(id): Promise<any> {
        return db.findOne({ _id: id})
            .then(Issue.expandDoc)
            .then(Promise.resolve)
            .catch(Promise.reject);
    }

    static reduceDoc(doc, level: '1' | '2') {

    }

    static expandDoc(doc): Promise<any> {
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
                return Promise.resolve(doc);
            })
            .catch(Promise.reject);
        
    }
}