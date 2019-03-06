import * as _ from 'lodash';
import { UserModel, TaskModel, CalcuTaskModel, SolutionModel, GeoDataModel, ModelServiceModel, ObsSiteModel, SchemaModel } from '../models';
import { ObjectID } from 'mongodb';
import * as RequestCtrl from '../utils/request.utils';
import * as path from 'path';
import { setting } from '../config/setting';
import * as child_process from 'child_process';

let fluxPFTs = ['DBF', 'EBF', 'ENF', 'DNF', 'GRA', 'WSA', 'SAV', 'OSH', 'CSH'];
let msOrder = [
    'IBIS site', 
    'Biome-BGC site', 
    'LPJ site', 
    'MODIS MOD 17 A2', 
    'Fluxdata', 
]

class Result {
    pft: String;
    indexs: Number[];
    avg_mean: Number[];
    avg_std: Number[];
    avg_coef: Number[];
    avg_rmsd: Number[];
    avg_nse: Number[];
    avg_r2: Number[];
    means: Number[][];
    stds: Number[][];
    coefs: Number[][];
    rmsds: Number[][];
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
            console.log(`${index} simulation all zero`)
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
                avg_rmsd: [],
                avg_nse: [],
                avg_r2: [],
                means: [],
                stds: [],
                coefs: [],
                rmsds: [],
                nses: [],
                r2s: []
            }
            results.push(item)
        }
        item.indexs.push(index)
        item.means.push(method.result.means)
        item.stds.push(method.result.stds)
        item.rmsds.push(method.result.rmsds)
        item.coefs.push(method.result.coefs)
        item.nses.push(method.result.nses)
        item.r2s.push(method.result.r2s)
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
        result.avg_rmsd = getAvgByCol(result.rmsds)
        result.avg_coef = getAvgByCol(result.coefs)
        result.avg_nse = getAvgByCol(result.nses)
        result.avg_r2 = getAvgByCol(result.r2s)
    }
    return results
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

