const express = require('express');
import UserCtrl from '../controllers/user.controller';
const userCtrl = new UserCtrl();
const router = express.Router();
module.exports = router;

// region auth
import { userAuthMid } from '../middlewares/user-auth.middleware';
userAuthMid(router);
// endregion

router.route('/sign-in').post(userCtrl.signIn);

router.route('/sign-up').post(userCtrl.signUp);

router.route('/logout').post(userCtrl.logout);

router.route('/password-reset').post(userCtrl.resetPassword);

router.route('/set-up').post(userCtrl.setUp);

router.route('/:userName').get(userCtrl.getUserInfo);

router.route('/:id')
    .patch((req, res, next) => {
        let userId = req.params.id,
            ac = req.body.ac,
            pType = req.body.pType,
            pid = req.body.pid,
            fn = promise => promise.then(msg => res.json({data: msg})).catch(next);
        if(ac === 'unsubscribe' || ac === 'subscribe')
            fn(userCtrl.toggleSubscribe(userId, ac, pType, pid));
        else {
            return next();
        }
    });