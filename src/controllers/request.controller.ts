import { Response, Request, NextFunction } from "express";
const request = require('request-promise');
import * as fs from 'fs';

export const getByServer = (url: string, form: any) => {
    const options = {
        url:url,
        method:'GET',
        qs:form
    };
    return request(options);
};

export const postByServer = (url: string, form: any, cb: Function) => {

};