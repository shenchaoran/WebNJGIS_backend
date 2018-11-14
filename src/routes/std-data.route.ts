import { RouterExtends } from './base.route';
const express = require('express');
import {
    StdDataModel,
    SiteModel,
} from '../models';
import * as STDDataCtrl from '../controllers/std-data.controller';

const defaultRoutes = [
    'findAll',
    'find'
];

const router = express.Router();
module.exports = router;

router.route('/')
    .get((req, res, next) => {
        let ids = req.query.ids;
        if (ids) {
            StdDataModel.findByIds(ids)
                .then(docs => res.json({ data: docs }))
                .catch(next);
        }
        else {
            let pageSize = parseInt(req.query.pageSize) || 15,
                pageIndex = parseInt(req.query.pageIndex) || 1;
            StdDataModel.findByPages({}, {
                pageSize: pageSize,
                pageIndex: pageIndex
            })
                .then(rst => res.json({ data: rst }))
                .catch(next);
        }
    })

/**
 * 下载标准数据集中的数据
 */
router.route('/:className')
    .get((req, res, next) => {
        // let STD_CLASS = STDDataCtrl.get_STD_DATA_Class(req.params.className);
        // if (STD_CLASS) {
        //     let eventId = req.query.eventId;
        //     let query = req.query.query;
        //     if (!eventId || !query) {
        //         return next('invalid data query!');
        //     }
        //     new STD_CLASS().downloadData(eventId, query)
        //         .then(rst => {
        //             res.set({
        //                 'Content-Type': 'file/*',
        //                 'Content-Length': rst.length,
        //                 'Content-Disposition':
        //                     'attachment;filename=' +
        //                     rst.filename
        //             });
        //             return res.end(rst.data);
        //         })
        //         .catch(next);
        // }
        // else {
        //     return next();
        // }
    });

router.route('/:id/download')
    .get((req, res, next) => {
        STDDataCtrl.download(req.params.id, req.query.cfg)
            .then(rst => {
            })
            .catch(next);
    });

router.route('/:id/preview')
    .get((req, res, next) => {
        // STDDataCtrl.preview(req.params.id, req.query.cfg)
        //     .then(rst => {
        //         res.set({
        //             'Content-Type': 'file/*',
        //             'Content-Length': rst.length,
        //             'Content-Disposition':
        //                 'attachment;filename=' +
        //                 rst.filename
        //         });
        //         return res.end(rst.data);
        //     })
        //     .catch(next);
    });

RouterExtends(router, StdDataModel, defaultRoutes);