/**
 * 计算节点的路由，包括计算框架和服务框架对接的接口
 */

import { Response, Request, NextFunction } from 'express';
const express = require('express');
import { RouterExtends } from './base.route';
import { ComputingNode, computingNodeDB, calcuTaskDB } from '../models';
import * as CalcuTaskCtrl from '../controllers/calcu-task.controller';
import * as ComputingNodeCtrl from '../controllers/computing-node.controller';
import { nodeAuthMid } from '../middlewares/node-auth.middleware';

const db = computingNodeDB;
const defaultRoutes = ['insert'];
const router = express.Router();
module.exports = router;

nodeAuthMid(router);

router.route('/login')
    .post((req: Request, res: Response, next: NextFunction) => {
        const nodeName = req.body.nodeName;
        const password = req.body.password;
        if(nodeName === undefined || password === undefined) {
            res.locals.resData = {
                succeed: false
            }
            res.locals.succeed = true;
            return next();
        }
        ComputingNodeCtrl.login({
            nodeName: nodeName,
            password: password
        })
            .then(jwt => {
                res.locals = {
                    resData: jwt,
                    succeed: true
                };
                return next();
            })
            .catch(next);
    });

router.route('/logout')
    .post((req: Request, res: Response, next: NextFunction) => {

    });

RouterExtends(router, db, defaultRoutes);
