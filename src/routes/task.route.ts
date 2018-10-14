import { Response, Request, NextFunction } from 'express';
import { RouterExtends } from './base.route';
const express = require('express');
import CmpTaskCtrl from '../controllers/task.controller';
import * as CalcuTaskCtrl from '../controllers/calcu-task.controller';
import { taskDB as db, CmpState } from '../models';

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
        if(req.query.pageIndex === undefined) {
            req.query.pageIndex = 1;
        }
        else {
            req.query.pageIndex = parseInt(req.query.pageIndex);
        }

        new CmpTaskCtrl().findByPage({
            pageSize: req.query.pageSize,
            pageIndex: req.query.pageIndex
        })
            .then(rst => {
                return res.json({
                    data: rst
                });
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
                    return res.json({
                        data: {
                            _id: cmpTaskId,
                            ...startMsg
                        }
                    });
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
                return res.json({
                    data: doc
                });
            })
            .catch(next);
    })

router.route('/:id/start')
    .post((req: Request, res: Response, next: NextFunction) => {
        new CmpTaskCtrl().start(req.params.id)
            .then(msg => {
                return res.json({
                    data: {
                        msg
                    }
                })
            })
            .catch(next);
    });

/**
 * @return{
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
                return res.json({
                    data: rst
                });
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