import { calcuTaskDB, geoDataDB } from '../models'
import { Observable, interval, from, of, forkJoin  } from 'rxjs'
import { startWith, map, flatMap, switchMap, filter, mergeMap } from 'rxjs/operators'
import { setting } from '../config/setting'
import * as RequestCtrl from '../utils/request.utils'
import * as NodeCtrl from '../controllers/computing-node.controller'
import * as _ from 'lodash'
import DataCtrl from '../controllers/data.controller';

export default class MSRProgressDaemon {
    private msr

    constructor(public msrId) {}

    private getTransferData$(msr) {
        let toPulls = []
        for(let key in msr.IO) {
            if(key === 'std')
                continue
            _.map(this.msr.IO[key] as any[], event => {
                if(!event.cached) {
                    toPulls.push(from(DataCtrl.cacheData({
                        msrId: this.msrId,
                        eventId: event.id
                    })))
                }
            })
        }
        return toPulls
    }

    public async start() {
        let msr$ = interval(setting.daemon.msr_progress)
            .pipe(switchMap(i => from(calcuTaskDB.findOne({_id: this.msrId}))))
        let succeed$ = msr$.pipe(filter(doc => doc.state === 'FINISHED_SUCCEED'))
        let failed$ = msr$.pipe(filter(doc => doc.state === 'FINISHED_FAILED'))

        let fetch$ = succeed$.pipe(
            map(this.getTransferData$),
            flatMap(toPulls => forkJoin(...toPulls))
        )

        msr$.subscribe(v => {
            v
        })
        succeed$.subscribe(doc => {
            doc
        })

        return await new Promise((resolve, reject) => {
            let subscription = fetch$.subscribe(rsts => {
                subscription.unsubscribe()
                
                let msg = {
                    code: 200
                }
                if(setting.debug.child_process) {
                    resolve(msg)
                }
                else {
                    process.send(msg)
                }
            })
    
            failed$.subscribe(e => {
                subscription.unsubscribe()
                let msg = {
                    code: 500,
                    error: e
                };
                
                if(setting.debug.child_process) {
                    resolve(msg)
                }
                else {
                    process.send(msg)
                }
            })
        });
    }
}


process.on('message',function (m) {
    if(m.code == 'start') {
        let daemon = new MSRProgressDaemon(m.msrId)
        daemon.start()
    }
});