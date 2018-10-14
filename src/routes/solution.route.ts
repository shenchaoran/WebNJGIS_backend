import { Response, Request, NextFunction } from 'express';
const express = require('express');
import { RouterExtends } from './base.route';
import * as CmpSolutionCtrl from '../controllers/solution.controller';
import { solutionDB } from '../models/solution.model';
const db = solutionDB;

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

// router.route('/:id').get(solutionDB.find);

router.route('/:id')
    .get((req: Request, res: Response, next: NextFunction) => {
        CmpSolutionCtrl.getSlnDetail(req.params.id)
            .then(rst => {
                return res.json({
                    data: rst
                });
            })
            .catch(next);
    });

    
RouterExtends(router, db, defaultRoutes);