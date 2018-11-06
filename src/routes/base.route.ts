/**
 * 新建的路由器可以直接配置对数据库的增删查改路由:
 *      findAll, find, insert, update, remove
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

export const RouterExtends = (router, db, defaultRoutes) => {
    if (db) {
        if (_.indexOf(defaultRoutes, 'findAll') !== -1) {
            router
                .route('/')
                .get((req: Request, res: Response, next: NextFunction) => {
                    let pageSize = parseInt(req.query.pageSize) || 15,
                        pageIndex = parseInt(req.query.pageIndex) || 1;
                    db.findByPage({}, {
                            pageSize: pageSize,
                            pageIndex: pageIndex
                        })
                        .then(rst => {
                            return res.json({ data: rst });
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
                            .findOne({ _id: req.params.id })
                            .then(doc => {
                                return res.json({
                                    data: doc
                                });
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
                                return res.json({
                                    data: doc
                                });
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
                            .then((doc) => {
                                // TODO 此doc非彼doc
                                return res.json({
                                    data: doc
                                });
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
                        .then((doc) => {
                            return res.json({
                                data: doc
                            });
                        })
                        .catch(next);
                });
        }
    }
}

