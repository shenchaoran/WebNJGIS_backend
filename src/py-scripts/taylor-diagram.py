import matplotlib.pyplot as plt
import numpy as np
import skill_metrics as sm
import sys, getopt
import json
from netCDF4 import Dataset
from os import path
import time
from datetime import datetime, timedelta

GRID_LENGTH = 0.5
LON_START = -179.75
LON_END = 179.75 + GRID_LENGTH
LAT_START = -54.75
LAT_END = 82.25 + GRID_LENGTH

TIME_SPAN = 32 * 365
TIME_START = 1982
TIME_END = TIME_START + TIME_SPAN

lons = np.arange(LON_START, LON_END, GRID_LENGTH)
lats = np.arange(LAT_START, LAT_END, GRID_LENGTH)


def plotTaylorDiagram(observationVariable, ncPath, variableName):
    if not path.exists(ncPath):
        raise Exception('invalid nc-path')
    dataset = Dataset(ncPath, 'r', format='NETCDF4')
    targetVariable = dataset.variables[variableName]
    std = targetVariable[:,:,:].compressed().std()
    rmsd = sm.rmsd(targetVariable[:,:,:].compressed(), observationVariable[:,:,:].compressed())
    coef = np.corrcoef(targetVariable[:,:,:].compressed(), observationVariable[:,:,:].compressed())[0, 1]
    return std, rmsd, coef


if __name__ == '__main__':
    try:
        options, args = getopt.getopt(sys.argv[1:], '', ['variables=', 'ncPaths=', 'markerLabels=', 'output=', 'bboxs='])
        for opt in options:
            if opt[0] == '--variables':
                variables = json.loads(opt[1].replace('\'', '\"'))
            elif opt[0] == '--ncPaths':
                ncPaths = json.loads(opt[1].replace('\'', '\"'))
            elif opt[0] == '--markerLabels':
                markerLabels = json.loads(opt[1].replace('\'', '\"'))
            elif opt[0] == '--output':
                output = opt[1]
        # 第一个 nc 是观测数据
        if len(ncPaths) < 1:
            raise Exception('Invalid input')
        if not path.exists(ncPaths[0]):
            raise Exception('invalid nc-path')
        observationDataset = Dataset(ncPaths[0], 'r', format='NETCDF4')
        observationVariable = observationDataset.variables[variables[0]]
        stds = []
        rmsds = []
        coefs = []
        stds.append(observationVariable[:,:,:].compressed().std())
        rmsds.append(0)
        coefs.append(1)
        for i, nc in enumerate(ncPaths):
            if i == 0:
                continue
            std, rmsd, coef = plotTaylorDiagram(observationVariable, ncPaths[i], variables[i])
            stds.append(std)
            rmsds.append(rmsd)
            coefs.append(coef)
        intervalsCOR = np.concatenate((np.arange(0,1.0,0.2), [0.9, 0.95, 0.99, 1]))
        sm.taylor_diagram(stds, rmsds, coefs, markerLabel = markerLabels, 
                        tickRMS = np.arange(0,25,10), 
                        tickSTD = np.arange(9,20,5), tickCOR = intervalsCOR,
                        rmslabelformat = ':.1f')
        plt.savefig(output)
        print('******CMIP-PY-START')
        print('SUCCESS')
        print('******CMIP-PY-END')
    except getopt.GetoptError as instance:
        print(instance)
        sys.exit(1)
    except Exception as instance:
        print(instance)
        sys.exit(1)
        