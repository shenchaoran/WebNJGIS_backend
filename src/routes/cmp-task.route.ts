import { Response, Request, NextFunction } from 'express';
import { RouterExtends } from './base.route';
const express = require('express');
import CmpTaskCtrl from '../controllers/cmp-task.controller';
import * as CalcuTaskCtrl from '../controllers/calcu-task.controller';
import { cmpTaskDB, CmpState } from '../models';
const db = cmpTaskDB;

const defaultRoutes = [
    'remove',
    'update'
];

const router = express.Router();
module.exports = router;

// region auth
import { userAuthMid } from '../middlewares/user-auth.middleware';
userAuthMid(router);
// endregion

router.route('/')
    .get((req: Request, res: Response, next: NextFunction) => {
        if(req.query.pageSize === undefined) {
            req.query.pageSize = 25;
        }
        else {
            req.query.pageSize = parseInt(req.query.pageSize);
        }
        if(req.query.pageNum === undefined) {
            req.query.pageNum = 1;
        }
        else {
            req.query.pageNum = parseInt(req.query.pageNum);
        }

        new CmpTaskCtrl().findByPage({
            pageSize: req.query.pageSize,
            pageNum: req.query.pageNum
        })
            .then(rst => {
                res.locals = {
                    resData: rst,
                    succeed: true
                };
                return next();
            })
            .catch(next);
    })
    .post((req: Request, res: Response, next: NextFunction) => {
        if(req.body.calcuTasks && req.body.cmpTask) {
            let cmpTaskId
            Promise.all([
                new CmpTaskCtrl().insert(req.body.cmpTask),
                CalcuTaskCtrl.insertBatch(req.body.calcuTasks)
            ])
                .then(rsts => {
                    cmpTaskId = rsts[0]
                    if(req.body.cmpTask.state === CmpState.COULD_START) {
                        return new CmpTaskCtrl().start(cmpTaskId)
                    }
                })
                .then(startMsg => {
                    res.locals = {
                        succeed: true,
                        resData: {
                            _id: cmpTaskId,
                            ...startMsg
                        }
                    };
                    return next();
                })
                .catch(next);
        }
        else {
            return next(new Error('invalid request body!'));
        }
    });

router.route('/:id')
    .get((req: Request, res: Response, next: NextFunction) => {
        new CmpTaskCtrl().getTaskDetail(req.params.id)
            .then(doc => {
                res.locals = {
                    resData: doc,
                    succeed: true
                };
                return next();
            })
            .catch(next);
    })

router.route('/:id/start')
    .post((req: Request, res: Response, next: NextFunction) => {
        new CmpTaskCtrl().start(req.params.id)
            .then(msg => {
                res.locals = {
                    succeed: true,
                    resData: msg
                };
                return next()
            })
            .catch(next);
    });

/**
 * return {
 *  cmpObjId: cmpObj.id,
 *  msId: dataRefer.msId,
 *  done: true,
 *  cmpResult: dataRefer.cmpResult
 * }
 */
router.route('/:id/cmpResult')
    .get((req: Request, res: Response, next: NextFunction) => {
        new CmpTaskCtrl().getCmpResult(req.params.id, req.query.cmpObjId, req.query.msId)
            .then(rst => {
                res.locals = {
                    succeed: true,
                    resData: rst
                };
                return next();
            })
            .catch(next);
    });

router.route('/:id/stdResult')
    .get((req: Request, res: Response, next: NextFunction) => {
        new CmpTaskCtrl().getStdResult(req.params.id)
            .then(rst => {

            })
            .catch(next);
    });

RouterExtends(router, db, defaultRoutes);