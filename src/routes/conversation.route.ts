const express = require('express');
import { RouterExtends } from './base.route';
import ConversationCtrl from '../controllers/conversation.controller';
import { ConversationModel } from '../models';
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
        // TODO findOne by filter
        let pid = req.query.pid,
            fn = promise => promise.then(msg => res.json({data: msg})).catch(next);

        if(pid) {
            fn(conversationCtrl.findOne({pid: pid}))
        }
        else {
            let pageIndex = parseInt(req.query.pageIndex) || 1;
            let pageSize = parseInt(req.query.pageSize) || 20;
            fn(conversationCtrl.findByPages({pageIndex, pageSize}))
        }
    });

router.route('/:id')
    .get((req, res, next) => {
        let cid = req.params.id;
        conversationCtrl.findOne({_id: cid})
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
        let comment = req.body.comment;
        if (comment) {
            conversationCtrl.updateComment(cid, comment)
                .then(v => res.json({ data: v }))
                .catch(next);
        }
        else {
            next();
        }
    })


RouterExtends(router, ConversationModel, defaultRoutes);