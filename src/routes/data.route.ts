import { Response, Request, NextFunction } from "express";
const MyRouter = require('./base.route');

import * as DataCtrl from '../controllers/data.controller';

const router = new MyRouter();
module.exports = router;

router.route('/')
    .post(
        DataCtrl.uploadFiles,
        DataCtrl.post2Server
    );