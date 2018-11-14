import { Response, Request, NextFunction } from 'express';
const express = require('express');
import { RouterExtends } from './base.route';
import { CmpMethodModel } from '../models';
import CmpMethodCtrl from '../controllers/cmp-methods.controller';
const cmpMethodCtrl = new CmpMethodCtrl();

const defaultRoutes = [
    'findAll',
    'find',
    'update'
];

const router = express.Router();
module.exports = router;

// region auth
import { userAuthMid } from '../middlewares/user-auth.middleware';
userAuthMid(router);
// endregion

router.route('/matched')
    .get((req, res, next) => {
        if(req.query.schemaType) {
            cmpMethodCtrl.findAllMatched(req.query.schemaType)
                .then(rst => {
                    return res.json({
                        data: rst
                    });
                })
        }
        else {
            return next();
        }
    })

RouterExtends(router, CmpMethodModel, defaultRoutes);