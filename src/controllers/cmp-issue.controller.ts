import { Response, Request, NextFunction } from 'express';
import * as formidable from 'formidable';
import * as Promise from 'bluebird';
import * as _ from 'lodash';
import * as path from 'path';
import * as fs from 'fs';

import { cmpIssueDB } from '../models';

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

    static reduceDoc(doc, level: '1' | '2') {

    }
}