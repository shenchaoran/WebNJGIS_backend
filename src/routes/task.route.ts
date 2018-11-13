import { Response, Request, NextFunction } from 'express';
import * as Bluebird from 'bluebird';
import { RouterExtends } from './base.route';
const express = require('express');
import TaskCtrl from '../controllers/task.controller';
import CalcuTaskCtrl from '../controllers/calcu-task.controller';
import { taskDB as db, CmpState } from '../models';
import ConversationCtrl from '../controllers/conversation.controller';
const conversationCtrl = new ConversationCtrl();
const taskCtrl = new TaskCtrl();
const calcuTaskCtrl = new CalcuTaskCtrl();

const defaultRoutes = [
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
        let pageIndex = parseInt(req.query.pageIndex) || 1;
        let pageSize = parseInt(req.query.pageSize) || 20;

        taskCtrl.findByPage({
            pageSize: pageSize,
            pageIndex: pageIndex,
            userId: req.query.userId,
        })
            .then(rst => {
                return res.json({
                    data: rst
                });
            })
            .catch(next);
    })
    .post((req: Request, res: Response, next: NextFunction) => {
        let calcuTasks = req.body.calcuTasks,
            task = req.body.task,
            conversation = req.body.conversation;
        if(calcuTasks && task && conversation) {
            let cmpTaskId
            Bluebird.all([
                taskCtrl.insert(req.body.task),
                calcuTaskCtrl.insertBatch(req.body.calcuTasks),
                conversationCtrl.addConversation(conversation)
            ])
                .then(rsts => {
                    cmpTaskId = rsts[0]
                    if(req.body.task.state === CmpState.COULD_START) {
                        return new TaskCtrl().start(cmpTaskId);
                    }
                })
                .then(startMsg => {
                    return res.json({
                        data: {
                            _id: cmpTaskId,
                            ...startMsg
                        }
                    });
                })
                .catch(next);
        }
        else {
            return next(new Error('invalid request body!'));
        }
    });

router.route('/:id')
    .get((req: Request, res: Response, next: NextFunction) => {
        taskCtrl.findOne(req.params.id)
            .then(doc => {
                return res.json({
                    data: doc
                });
            })
            .catch(next);
    })

router.route('/:id/start')
    .post((req: Request, res: Response, next: NextFunction) => {
        new TaskCtrl().start(req.params.id)
            .then(msg => {
                return res.json({
                    data: {
                        msg
                    }
                })
            })
            .catch(next);
    });

/**
 * @return{
 *  cmpObjId: cmpObj.id,
 *  msId: dataRefer.msId,
 *  done: true,
 *  cmpResult: dataRefer.cmpResult
 * }
 */
router.route('/:id/cmpResult')
    .get((req: Request, res: Response, next: NextFunction) => {
        taskCtrl.getCmpResult(req.params.id, req.query.cmpObjId, req.query.msId)
            .then(rst => {
                return res.json({
                    data: rst
                });
            })
            .catch(next);
    });

router.route('/:id/stdResult')
    .get((req: Request, res: Response, next: NextFunction) => {
        taskCtrl.getStdResult(req.params.id)
            .then(rst => {

            })
            .catch(next);
    });

RouterExtends(router, db, defaultRoutes);