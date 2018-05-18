/**
 * 计算节点的路由，包括计算框架和服务框架对接的接口
 */

import { Response, Request, NextFunction } from 'express';
const MyRouter = require('./base.route');
import { ComputingNode, computingNodeDB, calcuTaskDB } from '../models';
import * as CalcuTaskCtrl from '../controllers/calcu-task.controller';
import * as ComputingNodeCtrl from '../controllers/computing-node.controller';
import { nodeAuthMid } from '../middlewares/node-auth.middleware';

const db = computingNodeDB;
const defaultRoutes = ['insert'];
const router = new MyRouter(db, defaultRoutes);
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
            res.locals.template = {};
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
                    succeed: true,
                    template: {}
                };
                return next();
            })
            .catch(next);
    });

router.route('/logout')
    .post((req: Request, res: Response, next: NextFunction) => {

    });


/**
 * deprecated 服务调用的方式变了，不用我这边主动调用了，所以host，port暂时用不到了
 * 更新host，port
 */
router
    .route('/:nodeName')
    .put((req: Request, res: Response, next: NextFunction) => {
        if(req.body.host && req.body.port) {
            db.update({
                auth: {
                    nodeName: req.params.nodeName
                }
            }, {
                '$set': {
                    host: req.body.host,
                    port: req.body.port
                }
            })
                .then(updateRst => {
                    // if(updateRst.writeErrors.length === 0 && updateRst.ok) {
                        res.locals = {
                            resData: {
                                succeed: true
                            },
                            succeed: true,
                            template: {}
                        };
                        return next();
                    // }
                })
                .catch(next);
        }
        else {
            next(new Error('invalidate request body!'));
        }
    });

router
    .route('/:nodeName/tasks')
    .get((req: Request, res: Response, next: NextFunction) => {
        CalcuTaskCtrl.getReadyTask(req.params.nodeName)
            .then(docs => {
                res.locals = {
                    resData: docs,
                    template: {},
                    succeed: true
                };
                next();
            })
            .catch(next);
    });

// 更新状态
router
    .route('/:nodeName/tasks/:taskId/state')
    .put((req: Request, res: Response, next: NextFunction) => {
        if (req.body.newState) {
            CalcuTaskCtrl.updateState(
                req.params.taskId,
                req.body.oldState,
                req.body.newState,
                req.params.nodeName
            )
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
        } else {
            return next(new Error('invalidate request body!'));
        }
    });

/**
 * 计算结束
 * 更新output 和 progress
 * body {
 *      state: number,
 *      outputs: [{
 *          id: string,
 *          value: any
 *      }],
 *      progress: number
 * }
 * 此处的output也只是文件id，不是实体，在需要文件时从计算容器获取
 */
router
    .route('/:nodeName/tasks/:taskId/data')
    .post((req: Request, res: Response, next: NextFunction) => {
        if (req.body.outputs) {
            CalcuTaskCtrl.updateOnFinished(
                req.params.nodeName,
                req.params.taskId,
                req.body.outputs,
                req.body.progress,
                req.body.state
            )
                .then(doc => {
                    res.locals = {
                        resData: doc,
                        template: {},
                        succeed: true
                    };
                    next();
                })
                .catch(next);
        } else {
            return next(new Error('invalidate request body!'));
        }
    });
