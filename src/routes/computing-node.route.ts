/**
 * 计算节点的路由，包括计算框架和服务框架对接的接口
 */

import { Response, Request, NextFunction } from 'express';
const MyRouter = require('./base.route');
import { ComputingNode, computingNodeDB, calcuTaskDB } from '../models';
import * as CalcuTaskCtrl from '../controllers/calcu-task.controller';
import * as ComputingNodeCtrl from '../controllers/computing-node.controller';
const db = computingNodeDB;

const defaultRoutes = [
    'insert'
];

const router = new MyRouter(db, defaultRoutes);
module.exports = router;

router.route('/:nodeName/tasks')
    .get((req: Request, res: Response, next: NextFunction) => {
        ComputingNodeCtrl.auth({
            nodeName: req.params.nodeName,
            token: req.query.token
        })
            .then(() => {
                CalcuTaskCtrl.getInitTask(req.params.nodeName)
                    .then(docs => {
                        res.locals = {
                            resData: {
                                docs: docs
                            },
                            template: {},
                            succeed: true
                        };
                        next();
                    })
            })
            .catch(next);
    });

// 更新状态
router.route('/:nodeName/tasks/:taskId/state')
    .put((req: Request, res: Response, next: NextFunction) => {
        if(req.body.newState) {
            CalcuTaskCtrl.updateState(req.params.nodeName, req.params.taskId, req.body.oldState, req.body.newState)
                .then(rst => {
                    res.locals = {
                        resData: {
                            succeed: true
                        },
                        template: {},
                        succeed: true
                    };
                    next();
                })
                .catch(next);
        }
        else {
            return next(new Error('invalidate request body!'));
        }
    });

// 更新output
router.route('/:nodeName/tasks/:taskId/data')
    .post((req: Request, res: Response, next: NextFunction) => {
        if(req.body.outputs) {
            CalcuTaskCtrl.updateData(req.params.nodeName, req.params.taskId, req.body.outputs)
                .then(doc => {
                    res.locals = {
                        resData: {
                            doc: doc
                        },
                        template: {},
                        succeed: true
                    };
                    next();
                })
                .catch(next);
        }
        else {
            return next(new Error('invalidate request body!'));
        }
    });

