import { Response, Request, NextFunction } from 'express';
import * as express from 'express';
import { RouterExtends } from './base.route';
import { topicDB as db, conversationDB } from '../models';
import TopicCtrl from '../controllers/topic.controller';
import ConversationCtrl from '../controllers/conversation.controller';
let topicCtrl = new TopicCtrl();
let conversationCtrl = new ConversationCtrl();

const defaultRoutes = [
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

        topicCtrl.findByPage({
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
    .post((req, res, next) => {
        let topic = req.body.topic,
            conversation = req.body.conversation;
        if (topic && conversation) {
            Promise.all([
                topicCtrl.insert(topic),
                conversationCtrl.addConversation(conversation)
            ])
                .then(rsts => {
                    if (rsts.every(rst => rst === true)) {
                        return res.json({ data: true });
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
    });

router.route('/:id')
    .get((req: Request, res: Response, next: NextFunction) => {
        topicCtrl.findOne(req.params.id)
            .then(rst => res.json({data: rst}))
            .catch(next);
    })
    .patch((req, res, next) => {
        let topic = req.body.topic,
            ac = req.body.ac,
            uid = req.body.uid,
            solutionId = req.body.solutionId,
            topicId = req.params.id,
            originalTopicId = req.body.originalTopicId,
            fn;
        if(ac === 'subscribe' || ac === 'unsubscribe') {
            fn = () => topicCtrl.subscribeToggle(topicId, ac, uid);
        }
        else if(ac === 'removeSolution' || ac === 'addSolution') {
            fn = () => topicCtrl.patchSolutionIds(topicId, ac, originalTopicId, solutionId);
        }
        else if (topic) {
            fn = () => topicCtrl.update(topic);
        }
        fn().then(v => res.json({ data: v })).catch(next);
    })
    .delete((req, res, next) => {
        let topicId = req.params.id;
        topicCtrl.delete(topicId)
            .then(v => res.json({ data: v }))
            .catch(next);
    });

RouterExtends(router, db, defaultRoutes);