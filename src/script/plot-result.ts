let statisticIndex = require('./statistic-index-db.js')
const path = require('path')
const Bluebird = require('bluebird')
const fs = Bluebird.promisifyAll(require('fs'))
import * as _ from 'lodash';
const child_process = require('child_process')

let taylor = async () => {
    
}

let main = async () => {
    await taylor()
}

main()