import * as Bluebird from 'bluebird';
import * as _ from 'lodash';
import * as path from 'path';
const fs = Bluebird.promisifyAll(require('fs'));
import { setting } from '../config/setting';
import * as child_process from 'child_process';
import { ITaskDocument, GeoDataModel, StdDataModel, TaskModel, ISchemaDocument } from '../models';
import { addYears, addDays, format, parse, addHours, max, min, differenceInDays } from 'date-fns';

const refactorMap = {
    table: 'csv.refactor.py',
    'obs-table': 'csv.refactor.py',
    NETCDF4: 'nc.refactor.py',
}

export default class RefactorCtrl {
    refactorIOs: RefactorIO[] = []
    fields = new Set()
    index;
    lat;
    long;
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
                            // TODO parse filename by spatial coordinate
                            this.lat,this.long;
    
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
                            fields: [],
                            colIndexs: [],
                            scales: [],
                            offsets: [],
                            refactorScript: null
                        };
                        this.refactorIOs.push(refactorIO)
                    }
                    let schema = _.find((process as any).schemas, schema => schema.id === df.schemaId) as ISchemaDocument
                    refactorIO.fields.push(df.field)
                    this.fields.add(cmpObj.name)
                    if(schema) {
                        refactorIO.refactorScript = refactorMap[schema.structure.type]
                        if(schema.structure.type === 'table' || schema.structure.type === 'obs-table') {
                            refactorIO.startDate = this._formatDate(schema.structure.start, schema.structure.unit);
                            refactorIO.endDate = this._formatDate(schema.structure.end, schema.structure.unit);
                            refactorIO.start = schema.structure.start;
                            refactorIO.end = schema.structure.end;
                            refactorIO.step = schema.structure.step || 1;
                            refactorIO.unit = schema.structure.unit;
                            let columnIndex = _.findIndex(schema.structure.columns, col => col.id === df.field)
                            if(columnIndex !== -1) {
                                let column = schema.structure.columns[columnIndex]
                                refactorIO.colIndexs.push(columnIndex)
                                refactorIO.scales.push(column.scale || 1)
                                refactorIO.offsets.push(column.offset || 0)
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
                            let variable = _.find(schema.structure.variables, variable => variable.name === df.field)
                            if(variable) {
                                refactorIO.scales.push(variable.scale || 1)
                                refactorIO.offsets.push(variable.offset || 0)
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
        maxStep = _.chain(this.refactorIOs).map(refactorIO => refactorIO.step).max().value();
        maxStart = max(...(_.map(this.refactorIOs, refactorIO => refactorIO.startDate) as any));
        minEnd = min(...(_.map(this.refactorIOs, refactorIO => refactorIO.endDate) as any));
        _.map(this.refactorIOs, refactorIO => {
            refactorIO.start = parseInt(differenceInDays(maxStart, refactorIO.startDate)/refactorIO.step as any)
            refactorIO.end -= parseInt(differenceInDays(refactorIO.endDate, minEnd)/refactorIO.step as any)
            refactorIO.step = Math.ceil(maxStep/refactorIO.step)
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
                        if(code === 0) {
                            try {
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
            for(let field of Array.from(this.fields)) {
                let refactoredCSV = []
                for(let refactorIO of this.refactorIOs) {
                    if(refactorIO.data) {
                        let varIndex = _.findIndex(refactorIO.fields, key => key === field)
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
                let resultFname
                if(this.task.isAllSTDCache) {
                    resultFname = `${this.index}-${this.lat}-${this.long}-${field}-${this.task.solutionId}`
                }
                else {
                    resultFname = `${this.index}-${this.lat}-${this.long}-${field}-${this.task._id.toString()}`
                }
                let resultPath = path.join(setting.refactor.path, resultFname)
                let resultStr = _.chain(csvT).map(row => row.join(',')).join('\n').value()
                let err = await fs.writeFileAsync(resultPath, resultStr, 'utf8')
                if(!err) {
                    this.task.refactored.push({
                        field,
                        fname: resultFname
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
    fields: string[];
    scales?: number[];
    offsets?: number[];
    colIndexs?: number[];
    data: [][];
    label: string;
    refactorScript: string;
}