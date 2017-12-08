/**
 * 新建的路由器可以直接配置对数据库的增删查改路由:
 *      find-all, find, insert, update, remove
 */

import {
    Response,
    Request,
    NextFunction,
    Router,
    RouterOptions
} from 'express';
const express = require('express');
import * as _ from 'lodash';

import { Mongoose } from '../models/mongoose.base';

module.exports = class MyRouter {
    constructor(db: Mongoose, defaultRoutes: string[]) {
        const router = express.Router();

        if(db) {
            if (_.indexOf(defaultRoutes, 'find-all') !== -1) {
                router
                    .route('/')
                    .get((req: Request, res: Response, next: NextFunction) => {
                        db
                            .find({})
                            .then(docs => {
                                res.locals.resData = docs;
                                res.locals.template = {};
                                res.locals.succeed = true;
                                return next();
                            })
                            .catch(next);
                    });
            }
            if (_.indexOf(defaultRoutes, 'find') !== -1) {
                router
                    .route('/:id')
                    .get((req: Request, res: Response, next: NextFunction) => {
                        if (req.params.id) {
                            db
                                .find({ _id: req.params.id })
                                .then(docs => {
                                    if (docs.length === 0) {
                                        res.locals.resData = undefined;
                                    } else {
                                        res.locals.resData = docs[0];
                                    }
                                    res.locals.template = {};
                                    res.locals.succeed = true;
                                    return next();
                                })
                                .catch(next);
                        } else {
                            return next(new Error('invalid request url!'));
                        }
                    });
            }
            if (_.indexOf(defaultRoutes, 'insert') !== -1) {
                router
                    .route('/')
                    .post((req: Request, res: Response, next: NextFunction) => {
                        if (req.body.doc) {
                            db
                                .insert(req.body.doc)
                                .then(doc => {
                                    res.locals.resData = {
                                        succeed: true
                                    };
                                    res.locals.template = {};
                                    res.locals.succeed = true;
                                    return next();
                                })
                                .catch(next);
                        } else {
                            return next(new Error('invalid request body!'));
                        }
                    });
            }
            if (_.indexOf(defaultRoutes, 'update') !== -1) {
                router
                    .route('/:id')
                    .put((req: Request, res: Response, next: NextFunction) => {
                        if (req.body.doc) {
                            db
                                .update({ _id: req.body.id }, req.body.doc)
                                .then(() => {
                                    res.locals.resData = {
                                        succeed: true
                                    };
                                    res.locals.template = {};
                                    res.locals.succeed = true;
                                    return next();
                                })
                                .catch(next);
                        } else {
                            return next(new Error('invalid request body!'));
                        }
                    });
            }
            if (_.indexOf(defaultRoutes, 'remove') !== -1) {
                router
                    .route('/:id')
                    .delete((req: Request, res: Response, next: NextFunction) => {
                        db
                            .remove({ _id: req.params.id })
                            .then(() => {
                                res.locals.resData = {
                                    succeed: true
                                };
                                res.locals.template = {};
                                res.locals.succeed = true;
                                return next();
                            })
                            .catch(next);
                    });
            }
        }
        
        router
            .route('/ping')
            .get((req: Request, res: Response, next: NextFunction) => {
                res.locals.succeed = true;
                res.locals.resData = [
                    {
                        href: req.originalUrl
                    }
                ];
                res.locals.template = [
                    {
                        href: 'string'
                    }
                ];
                return next();
            });
        
        return router;
    }
};
