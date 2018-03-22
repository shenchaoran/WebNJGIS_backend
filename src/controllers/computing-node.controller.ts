import { Response, Request, NextFunction } from 'express';
import * as formidable from 'formidable';
import * as Promise from 'bluebird';
import * as _ from 'lodash';
import * as path from 'path';
import * as fs from 'fs';
const jwt = require('jwt-simple');
const moment = require('moment');
import { setting } from '../config/setting';
import * as crypto from 'crypto';
const md5 = (v) => {
    return crypto.createHash('md5').update(v, 'utf8').digest('hex');
};

import { ComputingNode, computingNodeDB } from '../models';

export const login = (authInfo: any): Promise<any> => {
    return new Promise((resolve, reject) => {
        // 密码使用md5加密
        computingNodeDB
            .find({
                    "auth.nodeName": authInfo.nodeName,
                    "auth.password": md5(authInfo.password)
            })
            .then(docs => {
                if (docs.length) {
                    const node = docs[0];
                    const expires = moment()
                        .add(7, 'days')
                        .valueOf();
                    // 每次登陆操作才会产生新的 token
                    const token = jwt.encode(
                        {
                            iss: node.nodeName,
                            exp: expires
                        },
                        setting.jwt_secret
                    );
                    return resolve({
                        token: token,
                        expires: expires
                    });
                } else {
                    return reject(new Error('auth failed!'));
                }
            })
            .catch(reject);
    });
};

// TODO
export const logout = (): Promise<any> => {
    return ;
}