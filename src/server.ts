const express = require('express');
const app = express();
const http = require('http');
import * as _ from 'lodash';
import { setting } from './config/setting'; 
import { router } from './routes/index.route';
import { preReqMid, postResMid } from './middlewares';
import { init } from './init';
import './controllers/process.controller';
require('./controllers/cmp-methods')

init()
    .then(() => {
        //////////////////////////////////////router
        // (<any>global).app = app;
        app.set('port', setting.port || 3000);
        // app.set("views", path.join(__dirname, "../views"));
        // app.set("view engine", "ejs");

        // pre-request
        preReqMid(app);
        // request/response
        app.use(setting.API_prefix, router);
        // post-response
        postResMid(app);
        //////////////////////////////////////
        const server = http.createServer(app);
        server.listen(app.get('port'));
        server.on('error', (error: any) => {
            const port = app.get('port');
            if (error.syscall !== 'listen') {
                throw error;
            }

            const bind = typeof port === 'string' ? 'Pipe ' + port : 'Port ' + port;

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
            const bind =typeof addr === 'string' ? 'Pipe: ' + addr : 'Port: ' + addr.port;
            console.log(`******** start server succeed`);
            console.log(`******** ${bind}`);
        });
    })
    .catch(err => {
        console.error(err)
    });

module.exports = app;
