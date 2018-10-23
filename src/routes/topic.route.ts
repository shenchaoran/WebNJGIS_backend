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
        if (req.query.pageSize === undefined) {
            req.query.pageSize = 25;
        }
        else {
            req.query.pageSize = parseInt(req.query.pageSize);
        }
        if (req.query.pageIndex === undefined) {
            req.query.pageIndex = 1;
        }
        else {
            req.query.pageIndex = parseInt(req.query.pageIndex);
        }

        topicCtrl.findByPage({
            pageSize: req.query.pageSize,
            pageIndex: req.query.pageIndex
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
        if(topic && conversation) {
            Promise.all([
                topicCtrl.addTopic(topic),
                conversationCtrl.addConversation(conversation)
            ])
            .then(rsts => {
                if(rsts.every(rst => rst === true)) {
                    return res.json({data: true});
                }
                else {
                    return res.json({data: false});
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
            .then(rst => {
                return res.json({
                    data: rst
                });
            })
            .catch(next);
    })
    .patch((req, res, next) => {
        let topic = req.body.topic;
        if(topic) {
            topicCtrl.updateTopic(topic)
                .then(v => res.json({data: v}))
                .catch(next);
        }
        else {
            return next();
        }
    })
    .delete((req, res, next) => {
        let topicId = req.params.id;
        topicCtrl.deleteTopic(topicId)
            .then(v => res.json({data: v}))
            .catch(next);
    });


RouterExtends(router, db, defaultRoutes);