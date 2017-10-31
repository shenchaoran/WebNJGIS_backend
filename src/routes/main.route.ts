import { Response, Request, NextFunction } from "express";
const MyRouter = require('./base.route');
const LoginRouter = require('./login.route');
const DataRouter = require('./data.route');
const ModelToolsRouter = require('./model-tools.route');
const DataToolsRouter = require('./data-tools.route');
const VisualizationRouter = require('./visualization.route');

const router = new MyRouter();
module.exports = router;

router.use('/auth', LoginRouter);
router.use('/data', DataRouter);
router.use('/model-tools', ModelToolsRouter);
router.use('/data-tools', DataToolsRouter);
router.use('/visualization', VisualizationRouter);
