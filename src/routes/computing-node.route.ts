/**
 * 计算节点的路由，包括计算框架和服务框架对接的接口
 */

import { Response, Request, NextFunction } from 'express';
const express = require('express');
import { RouterExtends } from './base.route';
import { ComputingNodeModel, CalcuTaskModel } from '../models';
import * as ComputingNodeCtrl from '../controllers/computing-node.controller';
import { nodeAuthMid } from '../middlewares/node-auth.middleware';

const defaultRoutes = ['insert'];
const router = express.Router();
module.exports = router;

nodeAuthMid(router);

router.route('/login')
    .post((req: Request, res: Response, next: NextFunction) => {
        const nodeName = req.body.nodeName;
        const password = req.body.password;
        if(nodeName === undefined || password === undefined) {
            return res.json({
                data: {
                    succeed: false,
                    error: {}
                }
            });
        }
        ComputingNodeCtrl.login({
            nodeName: nodeName,
            password: password
        })
            .then(jwt => {
                return res.json({
                    data: jwt
                });
            })
            .catch(next);
    });

router.route('/logout')
    .post((req: Request, res: Response, next: NextFunction) => {

    });

RouterExtends(router, ComputingNodeModel, defaultRoutes);
