import { Response, Request, NextFunction } from "express";
import * as Promise from 'bluebird';

import * as RequestCtrl from './request.controller';
import { setting } from '../config/setting';
import * as APIModel from '../models/api.model';
const connectorDebug = debug('WebNJGIS: Connector')

export const connect2MSC = () => {
    const url = APIModel.getAPIUrl('connector');
    RequestCtrl.getByServer(url,undefined)
        .then(response => {
            connectorDebug('Connected to MSC succeed!');
        })
        .catch(error => {
            connectorDebug('Connected to MSC failed!');
            console.error(error);
        });
}