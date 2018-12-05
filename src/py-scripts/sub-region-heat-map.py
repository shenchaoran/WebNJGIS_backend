import sys, getopt
import json
from netCDF4 import Dataset
from os import path
import stat
import numpy as np
import time
from datetime import datetime

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
    maxLat = targetVariable.shape[1]
    maxLong = targetVariable.shape[2]
    # time, lat, long
    meanValues = np.empty((len(regions)))
    biasValues = np.empty((len(regions)))
    stdValues = np.empty((len(regions)))
    coefValues = np.empty((len(regions)))
    rmseValues = np.empty((len(regions)))
    for i, region in enumerate(regions):
        aLat = min(maxLat, region[1])
        zLat = min(maxLat, region[3])
        aLong = min(maxLong, region[0])
        zLong = min(maxLong, region[2])
        regionSize = targetVariable.shape[0] * (zLat - aLat) * (zLong - aLong)
        regionValues = targetVariable[:, aLat:zLat, aLong:zLong].reshape(regionSize)
        
        meanValues[i] = regionValues.mean()
        biasValues[i] = regionValues.std()
        stdValues[i] = regionValues.std()
        coefValues[i] = regionValues.std()
        rmseValues[i] = regionValues.std()

    dataset.close()
    return [meanValues, biasValues, stdValues, coefValues, rmseValues]

def HeatMapData(ncPaths, regions, variableNames):
    modelStatRegion3D = []
    for i, ncPath in enumerate(ncPaths):
        progress = (i+1)*100/len(ncPaths)
        print('-----Progress:%.2f%%-----' % progress)
        modelStatRegion3D.append(getSubRegionVariable(ncPath, regions, variableNames[i]))
    # stat-model-region
    return np.array(modelStatRegion3D).transpose(1, 0, 2)



if __name__ == '__main__':
    try:
        options, args = getopt.getopt(sys.argv[1:], '', ['variables=', \
                'markerLabels=', 'timeLabels=', 'ncPaths=', 'output=', 'bboxs='])
        for opt in options:
            if opt[0] == '--variables':
                variables = json.loads(opt[1].replace('\'', '\"'))
            elif opt[0] == '--ncPaths':
                ncPaths = json.loads(opt[1].replace('\'', '\"'))
            elif opt[0] == '--bboxs':
                bboxs = json.loads(opt[1])
        bboxs = np.array(bboxs)
        # minx, miny, maxx, maxy
        bboxs[:,0] = (bboxs[:,0] - LON_START) // GRID_LENGTH
        bboxs[:,1] = (bboxs[:,1] - LAT_START) // GRID_LENGTH
        bboxs[:,2] = (bboxs[:,2] - LON_START) // GRID_LENGTH
        bboxs[:,3] = (bboxs[:,3] - LAT_START) // GRID_LENGTH
        bboxs = bboxs.astype(int)

        statModelRegion3D = HeatMapData(ncPaths, bboxs, variables)
        print('******CMIP-PY-START')
        print(statModelRegion3D.tolist())
        print('******CMIP-PY-END')
    except getopt.GetoptError:
        print('ERROR')

