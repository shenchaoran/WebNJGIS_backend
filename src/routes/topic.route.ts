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
        let topic = req.body.topic;
        let ac = req.body.ac;
        let uid = req.body.uid;
        let topicId = req.params.id;
        if(ac === 'subscribe' || ac === 'unsubscribe') {
            topicCtrl.subscribeToggle(topicId, ac, uid)
                .then(v => res.json({ data: v }))
                .catch(next);
        }
        else if (topic) {
            topicCtrl.update(topic)
                .then(v => res.json({ data: v }))
                .catch(next);
        }
        else {
            return next();
        }
    })
    .delete((req, res, next) => {
        let topicId = req.params.id;
        topicCtrl.delete(topicId)
            .then(v => res.json({ data: v }))
            .catch(next);
    });

router.route('/:id/solution')
    .patch((req, res, next) => {
        let topicId = req.params.id;
        let ac = req.body.ac;
        let solutionId = req.body.solutionId;
        if (solutionId && (ac === 'add' || ac === 'remove')) {
            topicCtrl.patchSolutionIds(topicId, ac, solutionId)
                .then(v => res.json({ data: v }))
                .catch(next);
        }
        else {
            return next();
        }
    })


RouterExtends(router, db, defaultRoutes);