// inlet
const express = require('express');
const path = require('path');
const util = require('util'); 
const http = require('http');
import { Request, Response } from "express";
//////////////////////////////////////use for debug
const debug = require('debug');
(<any>global).debug = debug;
const serverDebug = debug('WebNJGIS: server');

import { setting } from './config/setting';
const router = require('./routes/main.route');
const preRouter = require('./middlewares/pre-request.middleware');
const postRouter = require('./middlewares/post-response.middleware');
const port = setting.port;
//////////////////////////////////////init operation
//TODO 创建文件夹 upload/geo_data

//////////////////////////////////////router
const app = express();
app.set("port", setting.port || 3000);
// app.set("views", path.join(__dirname, "../views"));
// app.set("view engine", "ejs");

// pre-request
app.use('/', preRouter);
// request/response
app.use('/', router);
// post-response
app.use('/', postRouter);
//////////////////////////////////////
const server = http.createServer(app);
server.listen(app.get('port'));
server.on('error', (error: any) => {
    const port = app.get('port');
    if (error.syscall !== 'listen') {
        throw error;
    }

    const bind = typeof port === 'string' ?
        'Pipe ' + port :
        'Port ' + port;

    // handle specific listen errors with friendly messages
    switch (error.code) {
        case 'EACCES':
            console.error(bind + ' requires elevated privileges');
            process.exit(1);
            break;
        case 'EADDRINUSE':
            console.error(bind + ' is already in use');
            process.exit(1);
            break;
        default:
            throw error;
    }
});
server.on('listening', () => {
    const addr = server.address();
    const bind = typeof addr === 'string' ?
        'Pipe: ' + addr :
        'Port: ' + addr.port;
        serverDebug(bind);
});

module.exports = app;