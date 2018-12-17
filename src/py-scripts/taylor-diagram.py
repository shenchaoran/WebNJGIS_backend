import matplotlib.pyplot as plt
import numpy as np
import skill_metrics as sm
import sys, getopt
from os import path
from cmip import CMIP

if __name__ == '__main__':
    try:
        cmip = CMIP()
        observationData = cmip.getData(0, allTime=False, timeIndex= 0)
        observationData = observationData.reshape(observationData.size)
        
        stds = []
        rmsds = []
        coefs = []
        stds.append(observationData.std())
        rmsds.append(0)
        coefs.append(1)

        for i, nc in enumerate(cmip.ncPaths):
            if i == 0:
                continue
            data = cmip.getData(i, allTime=False, timeIndex = 0)
            data = data.reshape(data.size)
            std = data.std()
            rmsd = sm.rmsd(data, observationData)
            coef = np.ma.corrcoef(data, observationData)[0, 1]
            
            stds.append(std)
            rmsds.append(rmsd)
            coefs.append(coef)
        # intervalsCOR = np.concatenate((np.arange(0,1.0,0.2), [0.9, 0.95, 0.99, 1]))
        sm.taylor_diagram(np.array(stds), np.array(rmsds), np.array(coefs), 
                        markerLabel = cmip.markerLabels, 
                        # tickRMS = np.arange(0,25,10), 
                        # tickSTD = np.arange(9,20,5), 
                        # tickCOR = intervalsCOR,
                        rmslabelformat = ':.1f')
        plt.savefig(cmip.output)
        print('******CMIP-PY-START')
        print('SUCCESS')
        print('******CMIP-PY-END')
    except Exception as instance:
        print(instance)
        sys.exit(1)
        