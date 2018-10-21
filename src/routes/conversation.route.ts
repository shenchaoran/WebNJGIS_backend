const express = require('express');
import { RouterExtends } from './base.route';
import ConversationCtrl from '../controllers/conversation.controller';
import { conversationDB as db } from '../models';
let conversationCtrl = new ConversationCtrl();

const defaultRoutes = [
    'insert',
    'update',
    'remove'
];

const router = express.Router();
module.exports = router;

router.route('/')
    .get((req, res, next) => {
        let pageIndex = req.query.pageIndex || 1;
        let pageSize = req.query.pageSize || 20;
        return conversationCtrl.findByPage(pageIndex, pageSize)
            .then(v => res.json({ data: v }))
            .catch(next);
    });

router.route('/:id')
    .get((req, res, next) => {
        let cid = req.params.id;
        conversationCtrl.findOne(cid)
            .then(v => res.json({ data: v }))
            .catch(next);
    });

router.route('/:id/comments')
    .get((req, res, next) => {
        let cid = req.params.id;
        let pageIndex = req.query.pageIndex || 1;
        let pageSize = req.query.pageSize || 20;
        conversationCtrl.getCommentsByPage(cid, pageIndex, pageSize)
            .then(v => res.json({ data: v }))
            .catch(next);
    })
    .post((req, res, next) => {
        let cid = req.params.id;
        let comment = req.body.comment;
        let conversation = req.body.conversation;
        if (conversation) {
            conversation.comments = [comment];
            conversationCtrl.addConversation(conversation)
                .then(v => res.json({ data: v }))
                .catch(next);
        }
        else if (comment) {
            conversationCtrl.addComment(cid, comment)
                .then(v => res.json({ data: v }))
                .catch(next);
        }
        else {
            next();
        }
    });

router.route('/:conversationId/comments/:commentId')
    .delete((req, res, next) => {
        let cid = req.params.conversationId;
        let commentId = req.params.commentId;
        conversationCtrl.deleteComment(cid, commentId)
            .then(v => res.json({ data: v }))
            .catch(next);
    })
    .patch((req, res, next) => {
        let cid = req.params.conversationId;
        let commentId = req.params.commentId;
        let comment = req.body;
        if (comment) {
            conversationCtrl.updateComment(cid, comment)
                .then(v => res.json({ data: v }))
                .catch(next);
        }
        else {
            next();
        }
    })


RouterExtends(router, db, defaultRoutes);