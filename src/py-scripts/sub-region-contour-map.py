from mpl_toolkits.basemap import Basemap, cm
import matplotlib.pyplot as plt
import sys, getopt
import json
from netCDF4 import Dataset
from os import path,chmod, remove
import numpy as np
import time
from datetime import datetime
from math import ceil, floor
from pyproj import Proj, transform

GRID_LENGTH = 0.5
LON_START = -179.75
LON_END = 179.75 + GRID_LENGTH
LAT_START = -54.75
LAT_END = 82.25 + GRID_LENGTH

TIME_SPAN = 32 * 365
TIME_START = 1982
TIME_END = TIME_START + TIME_SPAN

if __name__ == '__main__':
    try:
        options, args = getopt.getopt(sys.argv[1:], 'h', ['help', 'variables=', \
                'markerLabels=', 'timeLabels=', 'ncPaths=', 'output=', 'bboxs='])
        for opt in options:
            if opt[0] == '--variables':
                variables = json.loads(opt[1].replace('\'', '\"'))
            elif opt[0] == '--ncPaths':
                ncPaths = json.loads(opt[1].replace('\'', '\"'))
            elif opt[0] == '--bboxs':
                bboxs = json.loads(opt[1])
            elif opt[0] == '--markerLabels':
                markerLabels = json.loads(opt[1].replace('\'', '\"'))
            elif opt[0] == '--timeLabels':
                timeLabels = json.loads(opt[1].replace('\'', '\"'))
            elif opt[0] == '--output':
                output = opt[1]
        regions = np.array(bboxs)
        bboxs = np.array(bboxs)
        regions[:,0] = (regions[:,0] - LON_START) // GRID_LENGTH
        regions[:,1] = (regions[:,1] - LAT_START) // GRID_LENGTH
        regions[:,2] = (regions[:,2] - LON_START) // GRID_LENGTH
        regions[:,3] = (regions[:,3] - LAT_START) // GRID_LENGTH
        regions = regions.astype(int)

        # outputPath = output + '-' + markerLabels[i] + '.png'
        dataList = []
        for i, ncPath in enumerate(ncPaths):
            if not path.exists(ncPath):
                raise 'invalid netcdf file path'
            dataset = Dataset(ncPath, 'r', format='NETCDF4')
            data = dataset.variables[variables[i]][:,:,:]
            dataList.append(data)
            latVariable = dataset.variables['lat'][:]
            longVariable = dataset.variables['long'][:]
            maxLat = latVariable.shape[0]
            maxLong = longVariable.shape[0]
            dataset.close()

        plotsNumber = len(ncPaths)
        if plotsNumber <= 2:
            colNumber = plotsNumber
        else:
            colNumber = 3
        rowNumber = ceil(plotsNumber/colNumber)

        # TODO bias
        # TODO progress
        dpi = 100
        p1 = Proj(init='epsg:4326')
        p2 = Proj(init='epsg:3857')
        for l, timeLabel in enumerate(timeLabels):
            # 太慢了，测试通过了就注释掉这里
            # if l < 2:
                for i, region in enumerate(regions):
                    aLatIndex = min(maxLat, region[1])
                    zLatIndex = min(maxLat, region[3])
                    aLongIndex = min(maxLong, region[0])
                    zLongIndex = min(maxLong, region[2])
                    aLat = bboxs[i, 1]
                    aLon = bboxs[i, 0]
                    zLon = bboxs[i, 2]
                    zLat = bboxs[i, 3]
                    aX, aY = transform(p1, p2, aLon, aLat)
                    zX, zY = transform(p1, p2, zLon, zLat)
                    lats = latVariable[aLatIndex:zLatIndex]
                    longs = longVariable[aLongIndex:zLongIndex]
                    outputPath = output + '-' + timeLabel + '-' + 'R' + str(i+1) + '.png'

                    figW = abs((zLongIndex-aLongIndex)/dpi*10)
                    figH =  abs((zY - aY) * figW / (zX - aX) / 2)
                    fig = plt.figure(figsize=(figW, figH), tight_layout=True, dpi=dpi)
                    for j in range(rowNumber):
                        for k in range(colNumber):
                            plotIndex = j*colNumber + k + 1
                            if plotIndex <= len(ncPaths):
                                data = dataList[plotIndex-1][l, aLatIndex:zLatIndex, aLongIndex:zLongIndex]
                                ax = fig.add_subplot(rowNumber, colNumber, plotIndex)
                                ax.set_title(markerLabels[plotIndex-1] + '-' + timeLabel + '-R' + str(i+1))
                                plt.sca(ax)
                                m = Basemap(epsg='3857', \
                                    llcrnrlon = aLon, llcrnrlat = aLat, \
                                    urcrnrlon = zLon, urcrnrlat = zLat, \
                                    resolution = 'l')
                                m.drawcoastlines(linewidth=0.5)
                                m.drawcountries(linewidth=0.25)
                                xx, yy = np.meshgrid(longs, lats)
                                cs = m.contourf(xx, yy, data, latlon=True, cmap=plt.cm.jet)
                                m.colorbar(cs, location='bottom')

                    # plt.show()
                    fig.savefig(outputPath, format='png', transparent=True)

        print('******CMIP-PY-START')
        print('SUCCESS')
        print('******CMIP-PY-END')
    except Exception as instance:
        print(instance)