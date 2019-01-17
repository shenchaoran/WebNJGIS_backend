import { Response, Request, NextFunction } from "express";
const express = require('express');
const UserRouter = require('./user.route');
const DataRouter = require('./data.route');
const ModelToolsRouter = require('./model-service.route');
const VisualizationRouter = require('./visualization.route');
const CmpSolutionRouter = require('./solution.route');
const CmpTaskRouter = require('./task.route');
const NodeRouter = require('./computing-node.route');
const TopicRouter = require('./topic.route');
const SearchRouter = require('./search.route');
const CalcuRouter = require('./calculation.route');
const STDDataRouter = require('./std-data.route');
const STDResultRouter = require('./std-result.route');
const CmpMethodRouter = require('./cmp-methods.route');
const ConversationRouter = require('./conversation.route');
const SchemaRouter = require('./schema.route');
import { setting } from '../config/setting';

export const router = express.Router();

router.use('/user', UserRouter);
router.use('/search', SearchRouter);
router.use('/data', DataRouter);
router.use('/model-service', ModelToolsRouter);
router.use('/visualization', VisualizationRouter);
router.use('/comparison/methods', CmpMethodRouter);
router.use('/comparison/topics', TopicRouter);
router.use('/comparison/solutions', CmpSolutionRouter);
router.use('/comparison/tasks', CmpTaskRouter);
router.use('/nodes', NodeRouter);
router.use('/calculation', CalcuRouter);
router.use('/std-data', STDDataRouter);
router.use('/std-result', STDResultRouter);
router.use('/conversations', ConversationRouter);
router.use('/schemas', SchemaRouter);

router.route('/')
    .get((req, res, next) => {
        // return res.json({
        //     code: 200,
        //     data: 'model comparison container'
        // })
        return res.redirect(`${setting.API_prefix}/index`)
    })

router.route('/index')
    .get((req, res, next) => {
        return res.json({
            code: 200,
            data: 'model comparison container'
        })
    })