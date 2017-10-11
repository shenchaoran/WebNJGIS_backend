// inlet
const express = require('express');
const path = require('path');
const debug = require('debug')('webnjgis:server');
const http = require('http');
import { Request, Response } from "express";

import { setting } from './config/setting';
const router = require('./routes/index.route');
const preRouter = require('./middlewares/pre-request.middleware');
const postRouter = require('./middlewares/post-response.middleware');
const port = setting.port;
//////////////////////////////////////
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
        'pipe ' + addr :
        'port ' + addr.port;
    debug('***************Listening on ' + bind + '***************');
});

module.exports = app;