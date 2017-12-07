import { Response, Request, NextFunction } from "express";
const MyRouter = require('./base.route');
const router = new MyRouter();
module.exports = router;

import * as DataCtrl from '../controllers/data.controller';
import * as UDXParser from '../controllers/UDX.parser.controller';

router.route('/')
    .post(DataCtrl.insert)
    .get(
        DataCtrl.find,
        DataCtrl.convert2Tree
    );

router.route('/:id')
    .delete(DataCtrl.remove)
    .get(
        DataCtrl.download
    );

router.route('/:id/property')
    .get(UDXParser.parseUDXProp);

router.route('/:id/show')
    .get(UDXParser.parseUDXVisual);

// router.route('/compare/:left/2/:right')
//     .get(DataCtrl.compareUDX);