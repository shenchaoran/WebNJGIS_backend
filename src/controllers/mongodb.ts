let setting = require('../config/setting');
let mongoose = require('mongoose');

mongoose.Promise = require('bluebird');
let url = 'mongodb://' + setting.mongodb.host + ':' + setting.mongodb.port + '/' + setting.mongodb.name;
mongoose.connect(url);

mongoose.connection.on('connected', () => {
    console.log('Mongoose connected ');
});

mongoose.connection.on('error', (err: any) => {
    console.log('Mongoose err:' + err);
});

mongoose.connection.on('disconnected', () => {
    console.log('Mongoose disconnected');
});

module.exports = mongoose;