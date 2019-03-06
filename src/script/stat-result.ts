import * as _ from 'lodash';
import { UserModel, TaskModel, CalcuTaskModel, SolutionModel, GeoDataModel, ModelServiceModel, ObsSiteModel, SchemaModel } from '../models';
import { ObjectID } from 'mongodb';
import * as RequestCtrl from '../utils/request.utils';
import * as path from 'path';
const Bluebird = require('bluebird')
const fs = Bluebird.promisifyAll(require('fs'))
import { setting } from '../config/setting';
import * as child_process from 'child_process';

let fluxPFTs = ['DBF', 'EBF', 'ENF', 'DNF', 'GRA', 'WSA', 'SAV', 'OSH', 'CSH'];
let msOrder = [
    'IBIS site', 
    'Biome-BGC site', 
    'LPJ site', 
    'MODIS MOD 17 A2', 
    'Fluxnet', 
]

class Result {
    pft: String;
    indexs: Number[];
    avg_mean: Number[];
    avg_std: Number[];
    avg_coef: Number[];
    avg_rmse: Number[];
    avg_nse: Number[];
    avg_r2: Number[];
    means: Number[][];
    stds: Number[][];
    coefs: Number[][];
    rmses: Number[][];
    nses: Number[][];
    r2s: Number[][];
}

// let sortStat = (stats) => {
//     // orders: [dist position, source position]
//     stats.orders = stats.labels.map((label, i) => {
//         let v = msOrder.findIndex(label)
//         if(v != -1) {
//             return [v, i]
//         }
//         else 
//             console.log('invalid label')
//     })
//     stats.orders.sort((v1, v2) => {

//     })
// }

let statResult = async () => {
    let tasks = await TaskModel.find({'meta.desc': 'auto-create by admin for batch test, GPP, 8 day interval'})
    let results: Result[] = []
    for(let task of tasks) {
        let site: any = task.sites[0]
        let pft = site.PFT
        let index = site.index

        let methods = _.get(task, 'refactored.0.methods')
        if(!methods) {
            console.log('methods doesn\'t exits')
            continue
        }
        let method = methods.find(method => method.name === 'statistical index')
        if(!method) {
            console.log('statistical method doesn\'t exits')
            continue
        }
        if(!method.result) {
            console.log('statistical method result doesn\'t exits')
            continue
        }
        if(method.result.stds.indexOf(0) != -1) {
            console.log(`--------------${index} simulation all zero`)
            continue
        }

        let item: Result = results.find(item => item.pft === pft)
        if(!item) {
            item = {
                pft,
                indexs: [],
                avg_mean: [],
                avg_std: [],
                avg_coef: [],
                avg_rmse: [],
                avg_nse: [],
                avg_r2: [],
                means: [],
                stds: [],
                coefs: [],
                rmses: [],
                nses: [],
                r2s: []
            }
            results.push(item)
        }
        // filter null value
        let invalid = _.some(_.concat(method.result.means, method.result.stds, method.result.coefs, method.result.rmses, method.result.nses, method.result.r2s), v => v===null)
        if(invalid) {
            continue
        }
        else {
            method.result.rmses[4] = 0
            method.result.coefs[4] = 1
            method.result.r2s[4] = 1
            item.means.push(method.result.means)
            item.stds.push(method.result.stds)
            item.rmses.push(method.result.rmses)
            item.coefs.push(method.result.coefs)
            item.nses.push(method.result.nses)
            item.r2s.push(method.result.r2s)
            item.indexs.push(index)
        }
    }
    let getAvgByCol = (matrix) => {
        let rst = []
        for(let [i, row] of matrix.entries()) {
            for(let [j, cell] of row.entries()) {
                if(rst.length <= j)
                    rst.push(0)
                rst[j]+=cell
                if(i === matrix.length-1) {
                    rst[j] /= matrix.length
                }
            }
        }
        return rst
    }
    for(let result of results) {
        result.avg_mean = getAvgByCol(result.means)
        result.avg_std = getAvgByCol(result.stds)
        result.avg_rmse = getAvgByCol(result.rmses)
        result.avg_coef = getAvgByCol(result.coefs)
        result.avg_nse = getAvgByCol(result.nses)
        result.avg_r2 = getAvgByCol(result.r2s)
    }
    // let shortResult = results.map(result => {
    //     delete result.means
    //     delete result.stds
    //     delete result.coefs
    //     delete result.rmses
    //     delete result.nses
    //     delete result.r2s
    // })
    let fpath = path.join(__dirname, '../../src/script/data/sites-stat.json')
    // console.log(fpath)

    await fs.writeFileAsync(fpath, JSON.stringify(results), 'utf8')
    return results
    console.log('finished')
}

let checkOrder = async () => {
    let tasks = await TaskModel.find({'meta.desc': 'auto-create by admin for batch test, 1'});
    tasks.map(task => {
        let refactored = _.get(task, 'refactored.0')
        if(!refactored) {
            console.log('refactored doesn\'t exists')
        }
        let method = refactored.methods.find(method => method.name === 'statistical index')
        
        let labels = method.result.labels
        labels.map((label, i) => {
            if(label !== msOrder[i]) {
                console.log('dimissed order')
            }
        })
    })
    console.log('checked')
}

let main = async () => {
    // await checkOrder();

    await statResult()
}

main()

