import { Response, Request, NextFunction } from 'express';
const express = require('express');
import { RouterExtends } from './base.route';
import { solutionDB as db } from '../models/solution.model';
import SolutionCtrl from '../controllers/solution.controller';
import ConversationCtrl from '../controllers/conversation.controller';
import UserCtrl from '../controllers/user.controller';
const solutionCtrl = new SolutionCtrl();
const conversationCtrl = new ConversationCtrl();
const userCtrl = new UserCtrl();

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

router.route('/')
    .get((req, res, next) => {
        let pageIndex = parseInt(req.query.pageIndex) || 1;
        let pageSize = parseInt(req.query.pageSize) || 20;
        solutionCtrl.findByPage({
            pageSize: pageSize,
            pageIndex: pageIndex,
            userId: req.query.userId,
        })
            .then(rst => res.json({data: rst}))
            .catch(next);
    })
    .post((req, res, next) => {
        let solution = req.body.solution,
            conversation = req.body.conversation;
        if(solution && conversation) {
            Promise.all([
                solutionCtrl.insert(solution),
                conversationCtrl.addConversation(conversation),
            ]).then(rsts => {
                if(rsts.every(rst => rst === true)) {
                    return res.json({data: true})
                }
                else {
                    return res.json({ data: false });
                }
            })
            .catch(next);
        }
        else {
            next();
        }
    })

router.route('/:id')
    .get((req: Request, res: Response, next: NextFunction) => {
        let solutionId = req.params.id,
            ac = req.query.ac,
            fn = promise => promise.then(msg => res.json({data: msg})).catch(next);
        if(ac === 'createTask') {
            fn(solutionCtrl.createTask(solutionId));
        }
        else {
            fn(solutionCtrl.findOne(solutionId));
        }
    })
    .patch((req, res, next) => {
        let solution = req.body.solution,
            ac = req.body.ac,
            uid = req.body.uid,
            solutionId = req.params.id,
            ids = req.body.ids,
            topicId = req.body.topicId,
            originalTopicId = req.body.originalTopicId,
            fn = promise => promise.then(msg => res.json({data: msg})).catch(next);
        if(ac === 'addTopic' || ac === 'removeTopic') {
            fn(solutionCtrl.patchTopicId(solutionId, ac, originalTopicId, topicId))
        }
        else if(ac === 'updatePts') {
            fn(solutionCtrl.updatePts(solutionId, ids))
        }
        else if(ac === 'updateCmpObjs') {
            fn(solutionCtrl.updateCmpObjs(solution))
        }
        else if (solution) {
            fn(solutionCtrl.update(solution))
        }
        else {
            return next();
        }
    })
    .delete((req, res, next) => {

    });

    
RouterExtends(router, db, defaultRoutes);