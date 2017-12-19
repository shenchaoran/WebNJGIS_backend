import { Response, Request, NextFunction } from 'express';
import * as formidable from 'formidable';
import * as Promise from 'bluebird';
import * as _ from 'lodash';
import * as path from 'path';
import * as fs from 'fs';

import { ComputingNode, computingNodeDB } from '../models'

export const auth = (authInfo: any): Promise<any> => {
    return new Promise((resolve, reject) => {
        computingNodeDB.find({
            auth: {
                nodeName: authInfo.nodeName,
                token: authInfo.token
            }
        })
            .then(docs => {
                if(docs.length) {
                    return resolve(docs[0]);
                }
                else {
                    return reject(new Error('auth failed!'));
                }
            })
            .catch(reject);
    });
};