import { Response, Request, NextFunction } from 'express';
import { RouterExtends } from './base.route';
const express = require('express');
import * as CmpSceneCtrl from '../controllers/cmp-scene.controller';
import { cmpSceneDB } from '../models/cmp-scene.model';
const db = cmpSceneDB;

const defaultRoutes = [
    'insert',
    'find',
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
        db
            .find({})
            .then(docs => {
                return CmpSceneCtrl.convert2Tree(req.query.user, docs);
            })
            .then(docs => {
                res.locals.resData = docs;
                                res.locals.succeed = true;
                return next();
            })
            .catch(next);
    });

    
     RouterExtends(router, db, defaultRoutes);