import { Response, Request, NextFunction } from "express";
import * as path from 'path';

import DataCtrl from '../controllers/data.controller';
import * as UDXPropParser from '../controllers/UDX.property.controller';
import * as UDXVisualParser from '../controllers/UDX.visualization.controller';
const MyRouter = require('./base.route');
import { stdDataDB } from '../models';
import * as STDDataCtrl from '../controllers/std-data.controller';
const db = stdDataDB;
const defaultRoutes = [
    'findAll',
    'find'
];

const router = new MyRouter(db, defaultRoutes);
module.exports = router;

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
                // res.set({
                //     'Content-Type': 'file/*',
                //     'Content-Length': rst.length,
                //     'Content-Disposition':
                //         'attachment;filename=' +
                //         encodeURIComponent(rst.filename)
                // });
                // return res.end(rst.data);
            })
            .catch(next);
    });