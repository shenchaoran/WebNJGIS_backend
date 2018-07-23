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

/**
 * 下载标准数据集中的数据
 */
router.route('/:className')
    .get((req, res, next) => {
        let STD_CLASS = STDDataCtrl.get_STD_DATA_Class(req.params.className);
        if (STD_CLASS) {
            let eventId = req.query.eventId;
            let query = req.query.query;
            if (!eventId || !query) {
                return next('invalid data query!');
            }
            new STD_CLASS().downloadData(eventId, query)
                .then(rst => {
                    res.set({
                        'Content-Type': 'file/*',
                        'Content-Length': rst.length,
                        'Content-Disposition':
                            'attachment;filename=' +
                            encodeURIComponent(rst.filename)
                    });
                    return res.end(rst.data);
                })
                .catch(next);
        }
        else {
            return next();
        }
    });

router.route('/met_site')
    .get((req, res, next) => {
        const fpath = path.join(__dirname, '../../IBIS_site.json');
        return res.download(fpath, 'site.json', err => {
            if(err) {
                return next(err);
            }
        });
        // siteDB
        //     .find({})
        //     // .findByPage({}, {
        //     //     pageSize: 500,
        //     //     pageNum: 1
        //     // })
        //     .then(docs => {
        //         return res.json({
        //             status: {
        //                 code: '200',
        //                 desc: 'succeed'
        //             },
        //             data: {
        //                 // docs: docs.docs,
        //                 // length: docs.docs.length
        //                 docs: docs,
        //                 length: docs.length
        //             }
        //         });
        //     });
    });

router.route('/:id/download')
    .get((req, res, next) => {
        STDDataCtrl.download(req.params.id, req.query.cfg)
            .then(rst => {
                res.set({
                    'Content-Type': 'file/*',
                    'Content-Length': rst.length,
                    'Content-Disposition':
                        'attachment;filename=' +
                        encodeURIComponent(rst.filename)
                });
                return res.end(rst.data);
            })
            .catch(next);
    });

router.route('/:id/preview')
    .get((req, res, next) => {
        STDDataCtrl.preview(req.params.id, req.query.cfg)
            .then(rst => {
                res.set({
                    'Content-Type': 'file/*',
                    'Content-Length': rst.length,
                    'Content-Disposition':
                        'attachment;filename=' +
                        encodeURIComponent(rst.filename)
                });
                return res.end(rst.data);
            })
            .catch(next);
    });

RouterExtends(router, db, defaultRoutes);