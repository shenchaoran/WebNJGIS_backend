import sys, getopt
import stat
import numpy as np
import time
import matplotlib.pyplot as plt
import skill_metrics as sm
import json
import imageio
from netCDF4 import Dataset
from datetime import datetime, timedelta
from functools import reduce
from mpl_toolkits.basemap import Basemap, cm
from os import path,chmod, remove
from math import ceil, floor
from pyproj import Proj, transform
from itertools import cycle, islice

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

class CMIP(object):
    def __init__(self):
        options, args = getopt.getopt(sys.argv[1:], '', ['variables=', \
                'markerLabels=', 'timeLabels=', 'ncPaths=', 'output=', 'bboxs=', 'stdCFName='])
        for opt in options:
            if opt[0] == '--variables':
                self.variables = json.loads(opt[1].replace('\'', '\"'))
            elif opt[0] == '--ncPaths':
                self.ncPaths = json.loads(opt[1].replace('\'', '\"'))
            elif opt[0] == '--bboxs':
                bboxs = json.loads(opt[1])
            elif opt[0] == '--markerLabels':
                self.markerLabels = json.loads(opt[1].replace('\'', '\"'))
            elif opt[0] == '--timeLabels':
                self.timeLabels = json.loads(opt[1].replace('\'', '\"'))
            elif opt[0] == '--output':
                self.output = opt[1]
            elif opt[0] == '--stdCFName':
                self.stdCFName = opt[1]
        
        if(bboxs):
            self.xyIndexs = np.array(bboxs)
            self.latlongs = np.array(bboxs)
            # minx, miny, maxx, maxy
            self.xyIndexs[:,0] = (self.xyIndexs[:,0] - LON_START) // GRID_LENGTH
            self.xyIndexs[:,1] = (self.xyIndexs[:,1] - LAT_START) // GRID_LENGTH
            self.xyIndexs[:,2] = (self.xyIndexs[:,2] - LON_START) // GRID_LENGTH
            self.xyIndexs[:,3] = (self.xyIndexs[:,3] - LAT_START) // GRID_LENGTH
            self.xyIndexs = self.xyIndexs.astype(int)
            self.regionCount = len(self.xyIndexs)
        else:
            self.regionCount = 0

        self.ncCount = len(self.ncPaths)
        self.latCount = None
        self.longCount = None

    # TODO 将要素 invalid range 的值 mask 掉# 
    # TODO 和 variable-range 结合起来，要不然出的图有很多无效范围  
    def __maskInvalid(self, data):
        minV=2
        maxV=10
        data[:] = np.ma.masked_invalid(data)
        data[:] = np.ma.masked_where(data[:] == 0, data[:])
        data[:] = np.ma.masked_where((data[:] < minV) | (data[:] > maxV), data[:])
        return data

    def getSubRegionData(self, ncIndex, allTime=False, timeIndex=0):
        if not path.exists(self.ncPaths[ncIndex]):
            raise 'invalid netcdf file path'
        dataset = Dataset(self.ncPaths[ncIndex], 'r', format='NETCDF4')
        # time, lat, long
        variable = dataset.variables[self.variables[ncIndex]]
        self.timeCount = variable.shape[0]

        if allTime:
            matrix = self.__maskInvalid(variable[:])
        else:
            matrix = self.__maskInvalid(variable[timeIndex])
        
        for xyIndex in self.xyIndexs:
            minx, miny, maxx, maxy = xyIndex
            xlen = variable.shape[2]
            if minx > maxx:
                if allTime:
                    sub1 = matrix[:, miny:maxy, minx:]
                    sub2 = matrix[:, miny:maxy, :maxx]
                    subDataset = np.hstack((sub1, sub2))
                else:
                    sub1 = matrix[timeIndex, miny:maxy, minx:]
                    sub2 = matrix[timeIndex, miny:maxy, :maxx]
                    subDataset = np.hstack((sub1, sub2))
            else:
                if allTime:
                    subDataset = matrix[:, miny:maxy, minx:maxx]
                else:
                    subDataset = matrix[timeIndex, miny:maxy, minx:maxx]
            yield subDataset
        dataset.close()

    def getData(self, ncIndex, allTime=False, timeIndex=0):
        if not path.exists(self.ncPaths[ncIndex]):
            raise 'invalid netcdf file path'
        dataset = Dataset(self.ncPaths[ncIndex], 'r', format='NETCDF4')
        # time, lat, long
        variable = dataset.variables[self.variables[ncIndex]]
        self.timeCount = variable.shape[0]
        if not self.latCount:
            latVariable = dataset.variables['lat']
            self.latCount = latVariable.shape[0]
            self.latVariable = latVariable[:]
        if not self.longCount:
            longVariable = dataset.variables['long']
            self.longCount = longVariable.shape[0]
            self.longVariable = longVariable[:]

        if allTime:
            matrix = self.__maskInvalid(variable[:])
        else:
            matrix = self.__maskInvalid(variable[timeIndex])
            
        dataset.close()
        return matrix

    # sub-region-line chart

    # sub-region-heat-map

    # box-diagram

    # contour-map

    # taylor-diagram