import sys, getopt
import json
from netCDF4 import Dataset
from os import path,chmod, remove
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
    regionTime2D = np.empty((regions.shape[0], targetVariable.shape[0]))
    for i, region in enumerate(regions):
        aLat = min(maxLat, region[1])
        zLat = min(maxLat, region[3])
        aLong = min(maxLong, region[0])
        zLong = min(maxLong, region[2])
        subDataset = targetVariable[:, aLat:zLat, aLong:zLong]
        subDataset = subDataset.reshape(subDataset.shape[0], subDataset.shape[1] * subDataset.shape[2])
        regionTime2D[i] = subDataset.mean(1)
    dataset.close()
    return regionTime2D

def LineChartData(ncPaths, regions, variableNames):
    # region, model, time
    modelRegionTime3D = []
    for i, ncPath in enumerate(ncPaths):
        progress = (i+1)*100/len(ncPaths)
        print('-----Progress:%.2f%%-----' % progress)
        modelRegionTime3D.append(getSubRegionVariable(ncPath, regions, variableNames[i]))
    return np.array(modelRegionTime3D).transpose(1, 0, 2)



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
        matrix = LineChartData(ncPaths, bboxs, variables)
        print('******CMIP-PY-START')
        print(matrix.tolist())
        print('******CMIP-PY-END')
    except getopt.GetoptError:
        print('ERROR')

