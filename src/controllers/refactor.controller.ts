import * as Bluebird from 'bluebird';
import * as _ from 'lodash';
import * as path from 'path';
const fs = Bluebird.promisifyAll(require('fs'));
import { setting } from '../config/setting';
import * as child_process from 'child_process';
import { ITaskDocument, GeoDataModel, MetricModel, StdDataModel, TaskModel, ISchemaDocument, ObsSiteModel } from '../models';
import { addYears, addDays, format, parse, addHours, max, min, differenceInDays } from 'date-fns';

const refactorMap = {
    table: 'csv.refactor.py',
    'obs-table': 'csv.refactor.py',
    NETCDF4: 'nc.refactor.py',
}

export default class RefactorCtrl {
    refactorIOs: RefactorIO[] = []
    metricNames = new Set()
    index;
    lat;
    long;
    obsSite;
    constructor(public task: ITaskDocument) {}

    private _formatDate(time, unit): Date {
        let endDate;
        let startDate = parse(unit + ' GMT+0')
        if(_.startsWith(unit, 'days since')) {
            let deltaYears = time/365;
            let deltaDays = time;
            if(deltaYears%1 === 0)
                endDate = addYears(startDate, deltaYears)
            else 
                endDate = addDays(startDate, deltaDays)
        }
        else if(_.startsWith('hours since')) {
            let deltaHours = time;
            endDate = addHours(startDate, deltaHours)
        }
        return endDate;
    }

    async _parse() {
        this.index = this.task.sites[0].index,
        this.lat = this.task.sites[0].lat,
        this.long = this.task.sites[0].long;
        
        this.task.isAllSTDCache = true
        for(let cmpObj of this.task.cmpObjs) {
            let metric = await MetricModel.findOne({name: cmpObj.name})
            for(let df of cmpObj.dataRefers) {
                try {
                    let id, inputFilePath;
                    if(df.type === 'simulation') {
                        id = `${df.msId}-${df.eventId}-${df.msrId}`
                        if(df.cachedPosition === 'DB') {
                            let geoData = await GeoDataModel.findOne({_id: df.value})
                            inputFilePath = path.join(setting.geo_data.path, geoData.meta.path);
                            this.task.isAllSTDCache = false;
                        }
                        else if(df.cachedPosition === 'STD') {
                            inputFilePath = path.join(setting.STD_DATA[df.msName], df.datasetId, 'outputs', df.value)
                        }
                    }
                    else if(df.type === 'observation') {
                        id = `${df.stdId}`
                        let stdData = await StdDataModel.findOne({_id: df.stdId})
                        if(stdData.schemaId === 'fluxdata-obs-table') {
                            this.obsSite = await ObsSiteModel.findOne({ index: parseInt(this.index) })
                            inputFilePath = path.join(setting.obs_data.path, `${this.obsSite.id}.csv`)
                        }
                        else {
                            inputFilePath = path.join(setting.geo_data.path, stdData.entries[0].path);
                        }
                    }
                    let refactorIO = _.find(this.refactorIOs, refactorIO => refactorIO.id === id)
                    if(!refactorIO) {
                        refactorIO = {
                            id,
                            inputFilePath,
                            lat: this.lat,
                            long: this.long,
                            data: null,
                            label: df.msName? df.msName: df.stdName,
                            metricNames: [],
                            dfMetricNames: [],
                            colIndexs: [],
                            scales: [],
                            offsets: [],
                            refactorScript: null,
                            tmp: [],
                            missing_values: [],
                            mins: [],
                            maxs: [],
                        };
                        this.refactorIOs.push(refactorIO)
                    }
                    let schema = _.find((process as any).schemas, schema => schema.id === df.schemaId) as ISchemaDocument
                    // refactorIO.dfMetricNames.push(df.field)
                    // refactorIO.metricNames.push(cmpObj.name)
                    this.metricNames.add(cmpObj.name)
                    // refactorIO.mins.push(metric.min)
                    // refactorIO.maxs.push(metric.max)
                    if(schema) {
                        refactorIO.refactorScript = refactorMap[schema.structure.type]
                        if(schema.structure.type === 'table') {
                            refactorIO.startDate = this._formatDate(schema.structure.start, schema.structure.unit);
                            refactorIO.endDate = this._formatDate(schema.structure.end, schema.structure.unit);
                            refactorIO.start = schema.structure.start;
                            refactorIO.end = schema.structure.end;
                            refactorIO.step = schema.structure.step || 1;
                            refactorIO.unit = schema.structure.unit;
                            refactorIO.sep = schema.structure.seperator;
                            refactorIO.header = schema.structure.header;
                            refactorIO.skiprows = schema.structure.skiprows;
                            let columnIndex = _.findIndex(schema.structure.columns, col => col.id === df.field)
                            if(columnIndex !== -1) {
                                let column = schema.structure.columns[columnIndex]
                                // refactorIO.colIndexs.push()
                                refactorIO.tmp.push([df.field, cmpObj.name, columnIndex, metric.min, metric.max, column.missing_value])
                                refactorIO.scales.push(column.scale || 1)
                                refactorIO.offsets.push(column.offset || 0)
                                // refactorIO.missing_values.push(column.missing_value)
                            }
                        }
                        else if(schema.structure.type === 'obs-table') {
                            refactorIO.start = 0;
                            refactorIO.end = (this.obsSite.endTime - this.obsSite.startTime + 1)*365;
                            refactorIO.step = 1;
                            refactorIO.unit = `days since ${this.obsSite.startTime}-01-01`
                            refactorIO.startDate = this._formatDate(0, refactorIO.unit)
                            refactorIO.endDate = this._formatDate(refactorIO.end, refactorIO.unit)
                            refactorIO.sep = schema.structure.seperator;
                            refactorIO.header = schema.structure.header;
                            refactorIO.skiprows = schema.structure.skiprows;
                            let columnIndex = _.findIndex(schema.structure.columns, col => col.id === df.field)
                            if(columnIndex !== -1) {
                                let column = schema.structure.columns[columnIndex]
                                // refactorIO.colIndexs.push(columnIndex)
                                refactorIO.tmp.push([df.field, cmpObj.name, columnIndex, metric.min, metric.max, column.missing_value])
                                refactorIO.scales.push(column.scale || 1)
                                refactorIO.offsets.push(column.offset || 0)
                                // refactorIO.missing_values.push(column.missing_value)
                            }
                        }
                        else if(schema.structure.type === 'NETCDF4') {
                            let timeVariable = _.find(schema.structure.variables, variable => variable.name === 'time')
                            refactorIO.startDate = this._formatDate(timeVariable.start, timeVariable.unit);
                            refactorIO.endDate = this._formatDate(timeVariable.end, timeVariable.unit);
                            refactorIO.start = timeVariable.start;
                            refactorIO.end = timeVariable.end;
                            refactorIO.step = timeVariable.step || 1;
                            refactorIO.unit = timeVariable.unit;
                            let variableIndex = _.findIndex(schema.structure.variables, variable => variable.name === df.field)
                            if(variableIndex != -1) {
                                let variable = schema.structure.variables[variableIndex]
                                refactorIO.scales.push(variable.scale || 1)
                                refactorIO.offsets.push(variable.offset || 0)
                                refactorIO.tmp.push([df.field, cmpObj.name, variableIndex, metric.min, metric.max, variable.missing_value])
                                // refactorIO.missing_values.push(variable.missing_value)
                            }
                        }
                    }
                }
                catch(e) {
                    console.error(e)
                }
            }
        }

        // 处理 start, end, step
        let maxStart, minEnd, maxStep;
        // maxStep = _.chain(this.refactorIOs).map(refactorIO => refactorIO.step).max().value();
        maxStep = this.task.temporal
        maxStart = max(...(_.map(this.refactorIOs, refactorIO => refactorIO.startDate) as any));
        minEnd = min(...(_.map(this.refactorIOs, refactorIO => refactorIO.endDate) as any));
        _.map(this.refactorIOs, refactorIO => {
            refactorIO.start = parseInt(differenceInDays(maxStart, refactorIO.startDate)/refactorIO.step as any)
            refactorIO.end -= differenceInDays(refactorIO.endDate, minEnd)
            refactorIO.end = parseInt(refactorIO.end/refactorIO.step as any)
            refactorIO.step = Math.ceil(maxStep/refactorIO.step)

            if(refactorIO.tmp.length) {
                refactorIO.tmp = refactorIO.tmp.sort((v1, v2) => v1[2] - v2[2])
                refactorIO.tmp.map(v => {
                    refactorIO.dfMetricNames.push(v[0])
                    refactorIO.metricNames.push(v[1])
                    refactorIO.colIndexs.push(v[2])
                    refactorIO.mins.push(v[3])
                    refactorIO.maxs.push(v[4])
                    refactorIO.missing_values.push(v[5])
                })
            }
            refactorIO.tmp = null
        })
    }

    async refactor() {
        try {
            await this._parse();
            await Bluebird.map(this.refactorIOs, v => {
                let refactorIO = v;
                return new Bluebird((resolve, reject) => {
                    let cmdStr = path.join(__dirname, '../refactors', refactorIO.refactorScript)
                    let args = [cmdStr, JSON.stringify(refactorIO)]
                    const cp = child_process.spawn('python', args)
                    // console.log(args)
                    let stdout = '', stderr = '';
                    cp.stdout.on('data', data => {
                        stdout += data.toString()
                    })
                    cp.stderr.on('data', data => {
                        stderr += data.toString()
                    })
                    cp.on('close', async code => {
                        console.log(stderr)
                        if(code === 0) {
                            try {
                                stdout = stdout.replace(/NaN/g, 'null')
                                refactorIO.data = JSON.parse(stdout)
                            }
                            catch(e) {

                            }
                            // console.log(refactorIO.refactorScript, refactorIO.label, stdout)
                            console.log(`******* ${refactorIO.label} refactor succeed`)
                            resolve()
                        }
                        else {
                            console.error(refactorIO.refactorScript, refactorIO.label, stderr)
                            resolve()
                        }
                    })
                })
            })
            
            this.task.refactored = [];
            for(let metricName of Array.from(this.metricNames)) {
                let refactoredCSV = []
                for(let refactorIO of this.refactorIOs) {
                    if(refactorIO.data) {
                        let varIndex = _.findIndex(refactorIO.metricNames, key => key === metricName)
                        if(varIndex !== -1) {
                            refactoredCSV.push(_.concat([refactorIO.label], refactorIO.data[varIndex]))
                        }
                    }
                }
                let csvT = [],
                    colNum = refactoredCSV[0].length,
                    rowNum = refactoredCSV.length;
                for(let j=0; j< colNum; j++) {
                    csvT.push([])
                    for(let i=0; i< rowNum; i++) {
                        csvT[j].push(refactoredCSV[i][j])
                    }
                }
                // 或者结尾用 solutionId 也行（前提是只有一套标准输入集），这样查找缓存更方便
                let resultFname, resultFolder
                if(this.task.isAllSTDCache) {
                    resultFolder = path.join(setting.geo_data.path, '../std-refactor', this.task.solutionId)
                    // resultFname = `${this.index}-${this.long}-${this.lat}-${metricName}.csv`
                    resultFname = `${this.index}-${metricName}.csv`
                    try {
                        await fs.accessAsync(resultFolder, fs.constants.F_OK)
                    }
                    catch(e) {
                        if(e.code === 'ENOENT') {
                            try {
                                await fs.mkdirAsync(resultFolder)
                            }
                            catch(e) {}
                        }
                    }
                }
                else {
                    resultFolder = path.join(setting.geo_data.path, '../custom-refactor')
                    resultFname = `${this.index}-${this.long}-${this.lat}-${metricName}-${this.task._id.toString()}.csv`
                }
                let resultPath = path.join(resultFolder, resultFname)
                let resultStr = _.chain(csvT).map(row => row.join(',')).join('\n').value()
                let err = await fs.writeFileAsync(resultPath, resultStr, 'utf8')
                if(!err) {
                    this.task.refactored.push({
                        metricName,
                        fname: resultFname,
                        methods: _.cloneDeep(this.task.cmpMethods),
                    })
                }
            }
            await TaskModel.updateOne({_id: this.task._id}, {$set: this.task})
            return this.task;
        }
        catch(e) {
            return Bluebird.reject(e)
        }
    }
}

// 调用重构子进程的 IO
class RefactorIO {
    id: string;
    inputFilePath: string;
    lat: number;
    long: number;
    step?: number;                      // 1 | 365
    start?: number;                     // 0
    end?: number;                       // (endyear - startyear)*365
    unit?: string;                      // "days since 1982-01-01"
    startDate?: Date;
    endDate?: Date;
    skiprows?: number;
    sep?: string;
    metricNames: string[];
    dfMetricNames: string[];
    scales?: number[];
    offsets?: number[];
    colIndexs?: number[];
    mins: number[];
    maxs: number[];
    missing_values: number[];
    data: [][];
    label: string;
    refactorScript: string;
    header?: number;
    tmp?: any;
}

