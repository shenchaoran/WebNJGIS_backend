import { Response, Request, NextFunction } from 'express';

const MyRouter = require('./base.route');
import * as UserCtrl from '../controllers/user.controller';

const router = new MyRouter();
module.exports = router;

// region auth
import { userAuthMid } from '../middlewares/user-auth.middleware';
userAuthMid(router);
// endregion

router.route('/login').post(UserCtrl.login);

router.route('/logout').post(UserCtrl.logout);

router.route('/register').post(UserCtrl.register);

router.route('/find-psw').post(UserCtrl.findPst);
