import { Response, Request, NextFunction } from "express";

const MyRouter = require('./base.route');
import * as ModelToolsCtrl from './../controllers/model-tools.controller';

const router = new MyRouter();
module.exports = router;

router.route('/')
    .get(ModelToolsCtrl.getModelTools);

router.route('/:id')
    .get(ModelToolsCtrl.getModelTool);

router.route('/:id/input')
    .get(ModelToolsCtrl.getModelInput);

router.route('/:id/invoke')
    .post(ModelToolsCtrl.invoke);