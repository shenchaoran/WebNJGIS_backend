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
    siteCount: Number;
    indexs: Number[];
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
    let tasks = await TaskModel.find({'meta.desc': 'auto-create by admin for batch test, 1'})
    let results: Result[] = []
    for(let task of tasks) {
        let site: any = task.sites[0]
        let pft = site.PFT
        let index = site.index
        let item: Result = results.find(item => item.pft === pft)
        if(!item) {
            item = {
                pft,
                siteCount: 0,
                indexs: [],
                means: [[]],
                stds: [[]],
                coefs: [[]],
                rmsds: [[]],
                nses: [[]],
                r2s: [[]]
            }
            results.push(item)
        }
        item.indexs.push(index)
        
        item.means
    }
}

let checkOrder = async () => {
    let tasks = await TaskModel.find({'meta.desc': 'auto-create by admin for batch test, 1'});
    let refactored = (tasks as any).refactored[0]
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
    console.log('checked')
}

let main = async () => {
    await checkOrder();
}

main()

