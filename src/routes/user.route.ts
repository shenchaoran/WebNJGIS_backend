const express = require('express');
import * as UserCtrl from '../controllers/user.controller';

const router = express.Router();
module.exports = router;

// region auth
import { userAuthMid } from '../middlewares/user-auth.middleware';
userAuthMid(router);
// endregion

router.route('/sign-in').post(UserCtrl.signIn);

router.route('/sign-up').post(UserCtrl.signUp);

router.route('/logout').post(UserCtrl.logout);

router.route('/password-reset').post(UserCtrl.resetPassword);

router.route('/set-up').post(UserCtrl.setUp);

//  RouterExtends(router, db, defaultRoutes);