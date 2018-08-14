import { Response, Request, NextFunction } from "express";
import * as path from 'path';
import { RouterExtends } from './base.route';
import DataCtrl from '../controllers/data.controller';
import * as UDXPropParser from '../controllers/UDX.property.controller';
import * as UDXVisualParser from '../controllers/UDX.visualization.controller';
const express = require('express');
import {
    stdDataDB,
    siteDB,
} from '../models';
import * as STDDataCtrl from '../controllers/std-data.controller';

const db = stdDataDB;
const defaultRoutes = [
    'findAll',
    'find'
];

const router = express.Router();
module.exports = router;

router.route('/docs')
    .get((req, res, next) => {
        let ids = req.query.ids;
        if(typeof ids === 'string') {
            ids = [ids]
        }
        if(ids) {
            stdDataDB.findDocs(ids)
                .then(docs => {
                    // res.locals = {
                    //     resData: docs,
                    //     succeed: true
                    // }
                    // return next()
                    return res.json({
                        data: docs,
                        status: {
                            code: '200',
                            desc: 'succeed'
                        }
                    })
                })
                .catch(next)
        }
        else {
            return next('invalid request body!')
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

RouterExtends(router, db, defaultRoutes);