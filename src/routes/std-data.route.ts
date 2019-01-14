import { RouterExtends } from './base.route';
const express = require('express');
import {
    StdDataModel,
    ObsSiteModel,
} from '../models';
import STDDataCtrl from '../controllers/std-data.controller';
const stdDataCtrl = new STDDataCtrl();

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
            StdDataModel.find({})
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

router.route('/:id/:entryName')
    .get((req, res, next) => {
        let entryName = req.params.entryName;
        let stdId = req.params.id;
        stdDataCtrl.download(stdId, entryName).then(({fname, stream}) => {
            res.set({
                'Content-Type': 'file/*',
                'Content-Disposition': 'attachment;filename=' + fname
            });
            return (stream as any).pipe(res);
        });
    });

RouterExtends(router, StdDataModel, defaultRoutes);