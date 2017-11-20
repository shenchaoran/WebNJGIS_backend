import { Response, Request, NextFunction } from "express";
const MyRouter = require('./base.route');

import * as DataCtrl from '../controllers/data.controller';
import * as UDXParser from '../controllers/UDX.parser.controller';

const router = new MyRouter();
module.exports = router;

router.route('/upload')
    .post(DataCtrl.uploadFiles);

router.route('/:id/download')
    .get(DataCtrl.downloadData);

router.route('/:id/property')
    .get(UDXParser.parseUDXProp);

router.route('/:id/show')
    .get(UDXParser.parseUDXVisual);

router.route('/compare/:left/2/:right')
    .get(DataCtrl.compareUDX);