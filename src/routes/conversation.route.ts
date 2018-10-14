const express = require('express');
import { RouterExtends } from './base.route';
import ConversationCtrl from '../controllers/conversation.controller';
import { conversationDB as db} from '../models';

const defaultRoutes = [
    'find',
    'findAll',
    'insert',
    'update',
    'remove'
];

const router = express.Router();
module.exports = router;



RouterExtends(router, db, defaultRoutes);