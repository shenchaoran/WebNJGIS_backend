import { Response, Request, NextFunction } from 'express';
const express = require('express');
import { TaskModel,  } from '../models'
import * as _ from 'lodash'

const router = express.Router();
module.exports = router;

router.route('/:index/:slnId/:metricName/state')
    .get((req: Request, res: Response, next: NextFunction) => {
        let index = req.params.index,
            slnId = req.params.slnId,
            metricName = req.params.metricName;
        TaskModel.findOne({
            solutionId: slnId,
            'sites.0.index': parseInt(index)
        })
            .then(task => {
                let rst = _.find(task.refactored, v => v.metricName === metricName)
                return res.json({data: rst})
            })
            .catch(next)
    });