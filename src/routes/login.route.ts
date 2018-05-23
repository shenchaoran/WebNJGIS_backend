import { Response, Request, NextFunction } from 'express';

const express = require('express');
import * as UserCtrl from '../controllers/user.controller';

const router = express.Router();
module.exports = router;

// region auth
import { userAuthMid } from '../middlewares/user-auth.middleware';
userAuthMid(router);
// endregion

router.route('/login').post(UserCtrl.login);

router.route('/register').post(UserCtrl.register);

router.route('/logout').post(UserCtrl.logout);

router.route('/find-psw').post(UserCtrl.findPst);

//  RouterExtends(router, db, defaultRoutes);