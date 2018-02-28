import { Response, Request, NextFunction } from 'express';
import * as formidable from 'formidable';
import * as Promise from 'bluebird';
import * as _ from 'lodash';
import * as path from 'path';
import * as fs from 'fs';

import { cmpIssueDB } from '../models';
import { cmpSolutionDB } from '../models/cmp-solution.model';

const db = cmpIssueDB;

export default class CmpIssue {
    constructor() {}

    static findAll(): Promise<any> {
        return db.find({})
            .then(docs => {
                _.map(docs, CmpIssue.reduceDoc);
                return Promise.resolve(docs);
            })
            .catch(Promise.reject);
    }

    static findByPage(pageOpt: {
        pageSize: number,
        pageNum: number
    }): Promise<any> {
        return db.findByPage({}, {
            pageSize: pageOpt.pageSize,
            pageNum: pageOpt.pageNum
        })
            .then(rst => {
                _.map(rst.docs, CmpIssue.reduceDoc);
                return Promise.resolve(rst);
            })
            .catch(Promise.reject);
    }

    static getIssueDetail(id): Promise<any> {
        return db.findOne({ _id: id})
            .then(CmpIssue.expandDoc)
            .then(Promise.resolve)
            .catch(Promise.reject);
    }

    static reduceDoc(doc, level: '1' | '2') {

    }

    static expandDoc(doc): Promise<any> {
        return Promise.all(_.map(doc.solutionIds, slnId => {
            return cmpSolutionDB.findOne({ _id: slnId});
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