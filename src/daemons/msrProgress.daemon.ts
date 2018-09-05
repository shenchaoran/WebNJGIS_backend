import { calcuTaskDB, geoDataDB } from '../models'
import { Observable, interval, from, of, forkJoin  } from 'rxjs'
import { startWith, map, flatMap, switchMap, filter, mergeMap } from 'rxjs/operators'
import { setting } from '../config/setting';
import { CalcuTaskState } from '../models';
import * as _ from 'lodash'

export default class MSRProgressDaemon {

    constructor(public msrId) {}

    public async start() {
        let msr$ = interval(setting.daemon.msr_progress)
            .pipe(switchMap(i => from(calcuTaskDB.findOne({_id: this.msrId}))));
        return new Promise((resolve, reject) => {
            let subscription = msr$.subscribe(msr => {
                if(msr.state === CalcuTaskState.FINISHED_SUCCEED) {
                    subscription.unsubscribe();
                    return resolve({
                        code: 200
                    });
                }
                else if(msr.state === CalcuTaskState.FINISHED_FAILED) {
                    subscription.unsubscribe();
                    return resolve({
                        code: 500,
                        error: `****** model run failed! ${this.msrId}`
                    });
                }
                else if(msr.state !== CalcuTaskState.RUNNING) {
                    subscription.unsubscribe();
                    return resolve({
                        code: 500,
                        error: `****** invalid model run state! ${this.msrId}`
                    });
                }
            }); 
        });
    }
}


process.on('message',function (m) {
    if(m.code == 'start') {
        let daemon = new MSRProgressDaemon(m.msrId)
        daemon.start()
            .then(msg => {
                process.send(msg);
            })
            .catch(e => {
                console.log(e);
                process.send({
                    code: 500,
                    desc: 'daemon msr progress failed!'
                });
            })
    }
});