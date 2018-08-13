import { Response, Request, NextFunction } from 'express';
import { RouterExtends } from './base.route';
const express = require('express');
import * as CmpTaskCtrl from '../controllers/cmp-task.controller';
import * as CalcuTaskCtrl from '../controllers/calcu-task.controller';
import { cmpTaskDB } from '../models/cmp-task.model';
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

        CmpTaskCtrl.findByPage({
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
            // TODO
            Promise.all([
                CmpTaskCtrl.insert(req.body.cmpTask),
                CalcuTaskCtrl.insertBatch(req.body.calcuTasks)
            ])
                .then(rsts => {
                    res.locals = {
                        succeed: true,
                        resData: rsts[0]._id
                    };
                    return next();
                })
                .catch(next);
            // CmpTaskCtrl.insert(req.body.doc)
            //     .then(_doc => {
            //         res.locals.resData = {
            //             doc: _doc
            //         };
            //                     //         res.locals.succeed = true;
            //         return next();
            //     })
            //     .catch(next);
        }
        else {
            return next(new Error('invalid request body!'));
        }
    });

router.route('/:id')
    .get((req: Request, res: Response, next: NextFunction) => {
        CmpTaskCtrl.getTaskDetail(req.params.id)
            .then(doc => {
                res.locals = {
                    resData: doc,
                    succeed: true
                };
                return next();
            })
            .catch(next);
    })
    // .get((req: Request, res: Response, next: NextFunction) => {
    //     CmpTaskCtrl.findOne(req.params.id)
    //         .then(doc => {
    //             res.locals = {
    //                 resData: {
    //                     doc: doc
    //                 },
    //                 succeed: true
    //             };
    //             return next();
    //         })
    //         .catch(next);
    // });


router.route('/:id/start')
    .post((req: Request, res: Response, next: NextFunction) => {

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
        CmpTaskCtrl.getCmpResult(req.params.id, req.query.cmpObjId, req.query.msId)
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
        CmpTaskCtrl.getStdResult(req.params.id)
            .then(rst => {

            })
            .catch(next);
    });

    
     RouterExtends(router, db, defaultRoutes);