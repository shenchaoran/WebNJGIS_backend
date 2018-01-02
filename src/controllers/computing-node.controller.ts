import { Response, Request, NextFunction } from 'express';
import * as formidable from 'formidable';
import * as Promise from 'bluebird';
import * as _ from 'lodash';
import * as path from 'path';
import * as fs from 'fs';
const jwt = require('jwt-simple');
const moment = require('moment');
import { setting } from '../config/setting';

import { ComputingNode, computingNodeDB } from '../models';

export const login = (authInfo: any): Promise<any> => {
    return new Promise((resolve, reject) => {
        computingNodeDB
            .find({
                    "auth.nodeName": authInfo.nodeName,
                    "auth.password": authInfo.password
            })
            .then(docs => {
                if (docs.length) {
                    const node = docs[0];
                    const expires = moment()
                        .add('days', 7)
                        .valueOf();
                    const token = jwt.encode(
                        {
                            iss: node.nodeName,
                            exp: expires
                        },
                        setting.jwt_secret
                    );
                    return resolve({
                        token: token,
                        expires: expires,
                        node: node
                    });
                } else {
                    return reject(new Error('auth failed!'));
                }
            })
            .catch(reject);
    });
};

export const logout = (): Promise<any> => {
    return ;
}