import sys, getopt
# import demjson
import json
from netCDF4 import Dataset
from os import path,chmod, remove
import stat
import numpy as np
import csv
import pandas
import re
import linecache
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

def getSubRegionVariable(ncPath, regions, variableName):
    if not path.exists(ncPath):
        return [0] * len(regions)
    dataset = Dataset(ncPath, 'r', format='NETCDF4')
    targetVariable = dataset.variables[variableName]
    # time, lat, long
    regionMeanValues = [targetVariable[:, region[2]:region[3], region[0]:region[1]].mean() for region in regions]
    dataset.close()
    return regionMeanValues

def HeatMapData(ncPaths, regions, variableNames):
    modelRegion2D = [getSubRegionVariable(ncPath, regions, variableNames[i]) for i, ncPath in enumerate(ncPaths)]
    return np.array(modelRegion2D)



if __name__ == '__main__':
    try:
        options, args = getopt.getopt(sys.argv[1:], 'h', ['help', 'variables=', 'ncPaths=', 'bboxs='])
        for opt in options:
            if opt[0] == '--variables':
                variables = json.loads(opt[1].replace('\'', '\"'))
            elif opt[0] == '--ncPaths':
                ncPaths = json.loads(opt[1].replace('\'', '\"'))
            elif opt[0] == '--bboxs':
                bboxs = json.loads(opt[1])
        bboxs = np.array(bboxs)
        bboxs[:,0] = (bboxs[:,0] - LON_START) // GRID_LENGTH
        bboxs[:,1] = (bboxs[:,1] - LON_START) // GRID_LENGTH
        bboxs[:,2] = (bboxs[:,2] - LAT_START) // GRID_LENGTH
        bboxs[:,3] = (bboxs[:,3] - LAT_START) // GRID_LENGTH
        bboxs = bboxs.astype(int)
        modelRegion2D = HeatMapData(ncPaths, bboxs, variables)
        print('******CMIP-PY-START')
        print(modelRegion2D.tolist())
        print('******CMIP-PY-END')
    except getopt.GetoptError:
        print('ERROR')

