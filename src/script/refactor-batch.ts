import { ObsSiteModel, SolutionModel, TaskModel, CalcuTaskModel, ResourceSrc, ModelServiceModel, OGMSState } from '../models'
import { postByServer, getByServer, PostRequestType } from '../utils/request.utils'
import * as Bluebird from 'bluebird'
import { ObjectID } from 'mongodb'
import * as _ from 'lodash'
import { Observable, interval } from 'rxjs'
import { map, switchMap, filter, tap, startWith } from 'rxjs/operators';
import { setting } from '../config/setting'

const slnIds = {
    '5c3f4bf02ba038eb47000012': 'time resulution of 1 day, with MODIS17A2',
    '5c3be0f7896f318e14000053': 'time resulution of 1 day',
    '5c3c70613139ed0427000004': 'time resulution of 1 year',
    '5c3c87243139ed0427000030': 'time resolution of 8 days',
}
const msIds = {
    '5a1122b1a5559025a032b39c': 'IBIS site',
    '5a1122b1a5559025a032b39d': 'Biome-BGC site'
}

const taskURL = `http://127.0.0.1:9999${setting.API_prefix}/comparison/tasks`
const tasks = [];
const calcuTasks = [[], []];
let insertTasks = async () => {
    let [sites, slns, mss] = await Bluebird.all([
        ObsSiteModel.find({}),
        SolutionModel.findByIds(Object.keys(slnIds)),
        ModelServiceModel.findByIds(Object.keys(msIds))
    ])
    for(let site of sites) {
        for(let [i, ms] of mss.entries()) {
            calcuTasks[i].push({
                _id: new ObjectID().toString(),
                meta: {
                    name: `site ${site.index} [${site.long}, ${site.lat}], simulated by ${ms.MDL.meta.name}`,
                    desc: 'batch create by admin',
                    time: new Date().getTime()
                },
                auth: {
                    userId: '5bcf18babd0edf7390f00461',
                    userName: 'SCR',
                    src: ResourceSrc.PUBLIC
                },
                nodeId: '5b5bdcb124e14013fc6e88f7',
                msName: ms.MDL.meta.name,
                msId: ms._id.toString(),
                cachedPosition: 'STD',
                state: OGMSState.COULD_START,
                IO: {
                    dataSrc: 'STD',
                    std: _.cloneDeep(ms.MDL.IO.std).map(event => {
                        if(event.id === '--dataset') {
                            event.value = '5b9012e4c29ca433443dcfab'
                        }
                        else if(event.id === '--index') {
                            event.value = site.index
                        }
                        return event
                    }),
                    inputs: ms.MDL.IO.inputs,
                    parameters: [],
                    outputs: ms.MDL.IO.outputs,
                }
            })
        }
    }
    for(let [i, site] of sites.entries()) {
        for(let [j, sln] of slns.entries()) {
            let nameSuffix;
            let ptCalcuTasks = calcuTasks.map(calcuTasks => calcuTasks[i])
            let task = {
                meta: {
                    name: `site ${site.index} [${site.long}, ${site.lat}], ${slnIds[sln._id.toString()]}`,
                    desc: `batch create by admin`,
                    time: new Date().getTime()
                },
                auth: {
                    userId: '5bcf18babd0edf7390f00461',
                    userName: 'SCR',
                    src: ResourceSrc.PUBLIC
                },
                state: OGMSState.COULD_START,
                solutionId: sln._id.toString(),
                topicId: sln.topicId,
                calcuTaskIds: ptCalcuTasks.map(v => v._id.toString()),
                observationIds: _.cloneDeep(sln.observationIds),
                sites: [site],
                cmpMethods: sln.cmpMethods,
                cmpObjs: _.cloneDeep(sln.cmpObjs).map(cmpObj => {
                    ptCalcuTasks.map(msr => {
                        let dr = cmpObj.dataRefers.find(dr => dr.type === 'simulation' && dr.msId === msr.msId && !dr.msrId)
                        dr.msrId = msr._id.toString()
                        dr.msrName = msr.meta.name
                    })
                    return cmpObj
                }),
            }
            tasks.push(task)
        }
    }

    let url = `http://127.0.0.1:9999${setting.API_prefix}/comparison/tasks?ac=insertMany`
    let res = await postByServer(url, {
        tasks: tasks,
        calcuTasks: _.flatten(calcuTasks),
    }, PostRequestType.JSON)
    console.log(res)
    console.log('finished')
}

let startTasks = async () => {
    let todoTasks = await TaskModel.find({'meta.desc': 'batch create by admin', state: 'COULD_START'})
    console.log(todoTasks.length)
    let counter = 0
    await Bluebird.map(todoTasks, (todoTask, i, len) => {
        let addURL = `http://127.0.0.1:9999${setting.API_prefix}/comparison/tasks/${todoTask._id.toString()}/start`
        return postByServer(addURL, {}, PostRequestType.JSON).then(res => {
            let stateURL = `${taskURL}/${todoTask._id.toString()}/hadFinished`  
            return new Bluebird((resolve, reject) => {
                let subscription = interval(2500).pipe(
                    switchMap((v, i) => {
                        return getByServer(stateURL, {})
                    }),
                ).subscribe(res => {
                    res = JSON.parse(res)
                    if(res.data === true) {
                        counter++
                        subscription.unsubscribe();
                        console.log(counter*100/len)
                        resolve()
                    }
                })
            })
        })
    }, {
        concurrency: 4
    })
    console.log('finished')
}

let startOneTask = async () =>{
    let todoTasks = await TaskModel.find({'meta.desc': 'batch create by admin'})
    let url = `http://127.0.0.1:9999${setting.API_prefix}/comparison/tasks/${todoTasks[0]._id.toString()}/start`
    await postByServer(url, {}, PostRequestType.JSON)
    let stateURL = `${taskURL}/${todoTasks[0]._id.toString()}/hadFinished`  
    await new Bluebird((resolve, reject) => {
        let subscription = interval(2500).pipe(
            switchMap((v, i) => {
                return getByServer(stateURL, {})
            }),
        ).subscribe(res => {
            res = JSON.parse(res)
            console.log(res.data)
            if(res.data === true)
                subscription.unsubscribe()
        })
    })
    console.log('finished')
}

let removeTasks = async () => {
    let removeSlnIds = [
        '5c3f4bf02ba038eb47000012',
        '5c3be0f7896f318e14000053',
        '5c3c70613139ed0427000004',
        '5c3c87243139ed0427000030',
    ]
    await Bluebird.all([
        // TaskModel.remove({'meta.desc': 'batch create by admin'}),
        // CalcuTaskModel.remove({'meta.desc': 'batch create by admin'})
        TaskModel.remove({'solutionId': {$in: removeSlnIds}}),
        CalcuTaskModel.remove({'solutionId': {$in: removeSlnIds}})
    ])
    console.log('finished')
}

let main = async () => {
    try {
        
        await removeTasks()
        await insertTasks()
        await startTasks()
        // await startOneTask()
        process.exit(0)
    }
    catch(e) {
        console.error(e)
    }
}

main()