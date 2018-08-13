import { Response, Request, NextFunction } from "express";
const express = require('express');
import ModelServiceCtrl from '../controllers/model-tools.controller';
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

router.route('/invoke')
    .post((req, res, next) => {
        const msInstance = req.body.msInstance;
        if (msInstance) {
            ModelServiceCtrl.invoke(msInstance)
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