import { Response, Request, NextFunction } from "express";

const MyRouter = require('./base.route');
import * as ModelToolsCtrl from './../controllers/model-tools.controller';
const postRouter = require('../middlewares/post-response.middleware');

const router = new MyRouter();
module.exports = router;

router.route('/')
    .get(
        ModelToolsCtrl.getModelTools
    );

router.route('/tree-mode')
    .get(
        ModelToolsCtrl.getModelTools,
        ModelToolsCtrl.convert2Tree
    );

router.route('/:id')
    .get(ModelToolsCtrl.getModelTool);

router.route('/:id/input')
    .get(
        ModelToolsCtrl.getModelInput,
        ModelToolsCtrl.getModelSchemas
    );

router.route('/:id/invoke')
    .post(ModelToolsCtrl.invokeModelTool);

router.route('/records/:id')
    .get(ModelToolsCtrl.getInvokeRecord);