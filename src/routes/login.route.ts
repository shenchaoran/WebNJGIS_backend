import { Response, Request, NextFunction } from 'express';

const MyRouter = require('./base.route');
import * as LoginCtrl from '../controllers/login.controller';

const router = new MyRouter();
module.exports = router;

router.route('/login').post(LoginCtrl.login);

router.route('/logout').post(LoginCtrl.logout);

router.route('/register').post(LoginCtrl.register);

router.route('/find-pst').post(LoginCtrl.findPst);
