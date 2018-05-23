import { Response, Request, NextFunction } from "express";
const express = require('express');
const LoginRouter = require('./login.route');
const DataRouter = require('./data.route');
const ModelToolsRouter = require('./model-tools.route');
const DataToolsRouter = require('./data-tools.route');
const VisualizationRouter = require('./visualization.route');
const CmpSolutionRouter = require('./cmp-solution.route');
const CmpTaskRouter = require('./cmp-task.route');
const CmpSceneRouter = require('./cmp-scene.route');
const NodeRouter = require('./computing-node.route');
const CmpIssueRouter = require('./cmp-issue.route');
const SearchRouter = require('./search.route');
const CalcuRouter = require('./calculation.route');
const STDDataRouter = require('./std-data.route');

export const router = express.Router();


router.use('/auth', LoginRouter);
router.use('/search', SearchRouter);
router.use('/data', DataRouter);
router.use('/model-tools', ModelToolsRouter);
router.use('/data-tools', DataToolsRouter);
router.use('/visualization', VisualizationRouter);
router.use('/comparison/issues', CmpIssueRouter);
router.use('/comparison/solutions', CmpSolutionRouter);
router.use('/comparison/tasks', CmpTaskRouter);
// router.use('/comparison/scenes', CmpSceneRouter);
router.use('/nodes', NodeRouter);
router.use('/calculation', CalcuRouter);
router.use('/std-data', STDDataRouter);