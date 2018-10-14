const express = require('express');
import { RouterExtends } from './base.route';
import ConversationCtrl from '../controllers/conversation.controller';
import { conversationDB as db} from '../models';

const defaultRoutes = [
    'findAll',
    'insert',
    'update',
    'remove'
];

const router = express.Router();
module.exports = router;

router.route('/:id')
    .get((req, res, next) => {
        let cid = req.params.id;
        new ConversationCtrl().findOne(cid)
            .then(msg => {
                return res.json(msg);
            })
            .catch(next);
    });

router.route('/:id/comments')
    .get((req, res, next) => {
        let cid = req.params.id;
        let pageIndex = req.query.pageIndex || 1;
        let pageSize = req.query.pageSize || 20;
        new ConversationCtrl().getCommentsByPage(cid, pageIndex, pageSize)
            .then(msg => {
                return res.json(msg);
            })
            .catch(next);
    });


RouterExtends(router, db, defaultRoutes);