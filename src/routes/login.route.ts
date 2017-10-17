import { Response, Request, NextFunction } from "express";

const MyRouter = require('./base.route');
import * as LoginCtrl from '../controllers/login.controller';

const router = new MyRouter();
module.exports = router;

router.route('/')
    .post(LoginCtrl.getModelTools);