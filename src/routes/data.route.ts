import { Response, Request, NextFunction } from "express";
const MyRouter = require('./base.route');

import * as DataCtrl from '../controllers/data.controller';
import * as UDXParser from '../controllers/UDX.parser.controller';

const router = new MyRouter();
module.exports = router;

router.route('/upload')
    .post(
        DataCtrl.uploadFiles,
        DataCtrl.post2Server
    );

router.route('/:id/download')
    .get(DataCtrl.downloadData);

router.route('/:id/parse')
    .get(UDXParser.parseUDX);

router.route('/:id/visualization')
    .post(DataCtrl.visualization);