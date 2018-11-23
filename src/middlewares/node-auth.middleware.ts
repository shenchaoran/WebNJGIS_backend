/**
 * 路由级中间件，负责computing-node.route的认证
 */

import { Response, Request, NextFunction } from 'express';
const express = require('express');
const logger = require('morgan');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const compression = require('compression');
const expressValidator = require('express-validator');
const session = require('express-session');
const jwt = require('jwt-simple');
import * as _ from 'lodash';

import { setting } from '../config/setting';
import { ComputingNodeModel } from '../models';

export const nodeAuthMid = app => {
    // 计算节点的请求认证
    app.use('*', (req: Request, res: Response, next: NextFunction) => {
        // region skip auth
        if (setting.auth === false) {
            return next();
        }
        const skipUrls = ['auth', 'css'];
        let isSkiped = false;
        _.map(skipUrls, skipUrl => {
            if (!isSkiped) {
                if (req.originalUrl.indexOf(skipUrl) !== -1) {
                    isSkiped = true;
                }
            }
        });
        if (isSkiped) {
            return next();
        }
        // endregion

        // 对于某些情况下不能写入到请求头，所以允许在body或者query中存放认证信息
        // 比如window.open时
        let token =
            (req.body && req.body['Authorization-node']) ||
            (req.query && req.query['Authorization-node']) ||
            req.header('Authorization-node');
        if (token && token.indexOf('bearer ') !== -1) {
            token = token.split('bearer ')[1];
        } else {
            const err = <any>new Error(
                'No node authorization, please login in first!'
            );
            err.status = 403;
            return next(err);
        }

        if (token) {
            try {
                const decoded = jwt.decode(token, setting.jwt_secret);
                // console.log(decoded);
                if (decoded.exp <= Date.now()) {
                    const err = <any>new Error('Access token has expired');
                    err.status = 406;
                    return next(err);
                } else {
                    ComputingNodeModel
                        .find({
                            auth: {
                                nodeName: decoded.iss
                            }
                        })
                        .then(docs => {
                            if (docs.length === 0) {
                                const err = <any>new Error(
                                    'Please login in first!'
                                );
                                err.status = 404;
                                return next(err);
                            } else {
                                const node = docs[0];
                                req.query.node = node;
                                return next();
                            }
                        })
                        .catch(next);
                }
            } catch (err) {
                return next();
            }
        } else {
            next();
        }
    });
};
