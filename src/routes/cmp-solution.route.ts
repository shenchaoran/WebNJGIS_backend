import { Response, Request, NextFunction } from 'express';
const express = require('express');
import { RouterExtends } from './base.route';
import * as CmpSolutionCtrl from '../controllers/cmp-solution.controller';
import { cmpSolutionDB } from '../models/cmp-solution.model';
const db = cmpSolutionDB;

const defaultRoutes = [
    'findAll',
    'insert',
    'remove',
    'update'
];

const router = express.Router();
module.exports = router;

// region auth
import { userAuthMid } from '../middlewares/user-auth.middleware';
userAuthMid(router);
// endregion

// router.route('/:id').get(cmpSolutionDB.find);

router.route('/:id')
    .get((req: Request, res: Response, next: NextFunction) => {
        CmpSolutionCtrl.getSlnDetail(req.params.id)
            .then(rst => {
                res.locals = {
                    resData: rst,
                    succeed: true
                };
                return next();
            })
            .catch(next);
    });

    
     RouterExtends(router, db, defaultRoutes);