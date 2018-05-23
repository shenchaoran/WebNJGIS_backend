import { Response, Request, NextFunction } from "express";
const express = require('express');
import MSCtrl from './../controllers/model-tools.controller';
import { modelServiceDB } from '../models/model-service.model';
import { calcuTaskDB } from '../models/calcu-task.model';
import { RouterExtends } from './base.route';
const db = modelServiceDB;

const defaultRoutes = [
    'findAll',
    'insert',
    'find',
    'remove'
];

const router = express.Router();
module.exports = router;

// region auth
import { userAuthMid } from '../middlewares/user-auth.middleware';
userAuthMid(router);
// endregion

// router.route('/')
//     .get((req: Request, res: Response, next: NextFunction) => {
//         if (req.query.pageSize === undefined) {
//             req.query.pageSize = 25;
//         }
//         else {
//             req.query.pageSize = parseInt(req.query.pageSize);
//         }
//         if (req.query.pageNum === undefined) {
//             req.query.pageNum = 1;
//         }
//         else {
//             req.query.pageNum = parseInt(req.query.pageNum);
//         }

//         MSCtrl.findByPage({
//             pageSize: req.query.pageSize,
//             pageNum: req.query.pageNum
//         })
//             .then(rst => {
//                 res.locals.resData = rst;
//                 res.locals.template = {};
//                 res.locals.succeed = true;
//                 return next();
//             })
//             .catch(next);
//     });

// router.route('/:id')
//     .get((req: Request, res: Response, next: NextFunction) => {
//         MSCtrl.getModelDetail(req.params.id)
//             .then(rst => {
//                 res.locals = {
//                     resData: rst,
//                     template: {},
//                     succeed: true
//                 };
//                 return next();
//             })
//             .catch(next);
//     });

router.route('/:id/invoke')
    .post((req, res, next) => {
        const msInstance = req.body.msInstance;
        if (msInstance) {
            MSCtrl.invoke(msInstance, req.body.type)
                .then(msg => {
                    res.locals = {
                        resData: msg,
                        succeed: true
                    }
                    return next();
                })
                .catch(e => {
                    console.log(e);
                    return next(e);
                })
        }
        else {
            return next('invalid request body!');
        }
    });

RouterExtends(router, db, defaultRoutes);