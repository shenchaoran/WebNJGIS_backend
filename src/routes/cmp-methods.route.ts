import { Response, Request, NextFunction } from 'express';
const express = require('express');
import { RouterExtends } from './base.route';
import { cmpMethodDB } from '../models';
import CmpMethodCtrl from '../controllers/cmp-methods.controller';
const db = cmpMethodDB;

const defaultRoutes = [
    'findAll',
    'find',
    'update'
];

const router = express.Router();
module.exports = router;

// region auth
import { userAuthMid } from '../middlewares/user-auth.middleware';
userAuthMid(router);
// endregion



RouterExtends(router, db, defaultRoutes);