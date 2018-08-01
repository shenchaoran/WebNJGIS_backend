import { setting } from './../config/setting';
import { Response, Request, NextFunction } from 'express';
const requestPromise = require('request-promise');
const request = require('request');
import * as fs from 'fs';
import * as Promise from 'bluebird';
import * as http from 'http'
import { ObjectID } from 'mongodb'
import * as path from 'path'
import { PassThrough } from 'stream'

// reference: https://github.com/request/request-promise

export const getByServer = (url: string, form: any, isFullResponse?: boolean): Promise<any> => {
    const options = {
        url: url,
        method: 'GET',
        qs: form,
        resolveWithFullResponse: isFullResponse === true
        // proxy: "http://127.0.0.1:3122"//for fiddler
    };
    if (setting.fiddler_proxy.use) {
        (options as any).proxy = `http://${setting.fiddler_proxy.host}:${setting.fiddler_proxy.port}`
    }
    return requestPromise(options)
        .catch(e => {
            return Promise.reject(e)
        })
};

export const postByServer = (url: string, body: any, type: PostRequestType): Promise<any> => {
    const options: any = {
        uri: url,
        method: 'POST'
    };
    if (setting.fiddler_proxy.use) {
        (options as any).proxy = `http://${setting.fiddler_proxy.host}:${setting.fiddler_proxy.port}`
    }
    if (type === PostRequestType.JSON) {
        // 后台信息都会存在req.body中
        options.body = body;
        // must add this line
        // encode the body to stringified json
        options.json = true;
        // Is set automatically
        options.headers = {
            'content-type': 'application/json'
        };
    } else if (type === PostRequestType.Form) {
        // 后台会全部放在req.body中。
        // 所以如果有文件的话，不能放在form中，headers不能为urlencoded
        options.form = body;
        // Is set automatically
        options.headers = {
            'content-type': 'application/x-www-form-urlencoded'
        };
    } else if (type === PostRequestType.File) {
        // 后台不在req.body, req.params, req.query中。
        // 所以如果在req.query中取值，要把那部分单独拿出来，插入到url中
        options.formData = body;
        // Is set automatically
        options.headers = {
            'content-type': 'multipart/form-data'
        };
    }
    return requestPromise(options)
        .catch(e => {
            return Promise.reject(e)
        })
};

// 通过管道请求转发 TODO fix hot
export const getByPipe = (req: Request, url: string) => {
    return new Promise((resolve, reject) => {
        req.pipe(
            request.get(url, (err, response, body) => {
                if (err) {
                    return reject(err);
                } else {
                    return resolve({
                        response: response,
                        body: body
                    });
                }
            })
        );
    });
};

export const postByPipe = (req: Request, url: string) => {
    return new Promise((resolve, reject) => {
        req.pipe(
            request
                .post(url)
                .then(response => {
                    return resolve(response);
                })
                .catch(error => {
                    return reject(error);
                })
        );
    });
};

/**
 * return response(stream)
 * 
 * 从远程请求文件，将文件写到本地，并将响应流返回到前台
 * fn 是写完文件后执行的函数，不是回调
 */
export const getFile = (url, folder, fn) => {
    let fname, fpath, newName
    let ext = '';
    newName = new ObjectID().toString()
    return new Promise((resolve, reject) => {
        try {
            http.get(url, response => {
                let res$1, res$2
                res$1 = new PassThrough()
                res$2 = new PassThrough()
                response.pipe(res$1)
                response.pipe(res$2)

                fname = response.headers['content-disposition'];
                if (fname) {
                    if (fname.indexOf('filename=') !== -1) {
                        fname = fname.substring(fname.indexOf('filename=') + 9);
                    }
                }
                if (!fname) {
                    fname = new ObjectID().toString();
                }
                if (fname.lastIndexOf('.') !== -1) {
                    ext = fname.substr(fname.lastIndexOf('.'));
                    newName += ext
                }
                fpath = path.join(folder, newName)
                resolve({
                    stream: res$1,
                    fname: fname
                })

                res$2.pipe(fs.createWriteStream(fpath))
                res$2.on('end', chunk => {
                    fn({
                        fname: fname,
                        fpath: newName
                    })
                })
            })
        }
        catch (e) {
            return reject(e)
        }
    })
        .catch(e => {
            console.error(e)
            return Promise.reject(e)
        })
}

export enum PostRequestType {
    // JSON REST API
    JSON = 1,
    // POST like a form
    Form = 2,
    // contains file
    File = 3
}
