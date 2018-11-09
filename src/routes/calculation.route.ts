import { Response, Request, NextFunction } from "express";
const express = require('express');
import { RouterExtends } from './base.route';
import { calcuTaskDB as db } from '../models/calcu-task.model';
import CalcuTaskCtrl from '../controllers/calcu-task.controller';
const calcuTaskCtrl = new CalcuTaskCtrl();

const defaultRoutes = [
    'findAll',
    'find',
    // 'insert',
    'remove'
    // 'update'
];
const router = express.Router();
module.exports = router;

// region auth
import { userAuthMid } from '../middlewares/user-auth.middleware';
userAuthMid(router);
// endregion

router.route('/:msrId')
    .get((req, res, next) => {
        calcuTaskCtrl.findOne(req.params.msrId)
            .then(msg => res.json({data: msg}))
            .catch(next);
    });

router.route('/:msrId/log')
    .get((req, res, next) => {

    })
    
RouterExtends(router, db, defaultRoutes);