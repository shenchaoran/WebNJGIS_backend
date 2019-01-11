import sys, getopt
import stat
import numpy as np
import time
import pymongo
import matplotlib.pyplot as plt
import skill_metrics as sm
import json
import imageio
import pandas as pd
from functools import reduce
from mpl_toolkits.basemap import Basemap, cm
from os import path, chmod, remove
from math import ceil, floor
from pyproj import Proj, transform
from itertools import cycle, islice

# {
#     inputFilePath,
#     chart: 'scatter' | 'line' | 'taylor' | 'box',
#     outputPath,
#     missing_value,
#     header,
#     metricName,
# }

argv = json.loads(sys.argv[1])

connection = pymongo.MongoClient('223.2.35.73', 27017)
cmpDB = connection['Comparison']
metricTable = cmpDB['Metric']
METRIC = metricTable.find_one({ "name" : argv['metricName']})
obsNameDict = {
    "GPP": "GPP_f",
    "NEE": "NEE_f",
    "Reco": "Reco",
    "NPP": "asdfsadfg"
}
obsOriginalName = obsNameDict[argv['metricName']]

df = pd.read_csv(argv['inputFilePath'], header=0)
df.mask(df > METRIC['max'], np.nan)
df.mask(df < METRIC['min'], np.nan)
if 'missing_value' in argv.keys():
    df.mask(df == METRIC['missing_value'], np.nan)

columnNumber = len(df.columns)
rowNumber = len(df)

for i, col in enumerate(df.columns):
    if col == obsOriginalName:
        obsColIndex = i
        obsColName = col
        obsCol = df[obsColName]
        obsData = obsCol.values
# obsColName = next((col for col in df if col == obsOriginalName), None)
# if obsColName:
    

if argv['chart'] == 'Scatter diagram':
    if 'obsColName' not in locals().keys:
        print('failed')
    # 多幅子图：每一幅是 simulation 和 observation 的散点图/回归直线
    plotColNumber = 2
    plotRowNumber = ceil(columnNumber/plotColNumber)
    plotIndex = 1
    # figH = 500
    # figW = 
    fig = plt.figure(figsize=(14, 14), tight_layout=True)

    for i in range(columnNumber):
        if i ==  obsColIndex:
            pass
        else:
            simCol = df.iloc[:,i]
            simData = simCol.values
            simColName = df.columns[i]

            ax = fig.add_subplot(plotRowNumber, plotColNumber, plotIndex)
            ax.set_title(simColName + '-' + obsColName)
            plt.sca(ax)
            plt.tight_layout()
        
            # left, width = 0.1, 0.65
            # bottom, height = 0.1, 0.65
            # bottom_h = left_h = left + width + 0.02
            # rect_scatter = [left, bottom, width, height]
            # rect_histx = [left, bottom_h, width, 0.2]
            # rect_histy = [left_h, bottom, 0.2, height]
            # axScatter = 
            ax.set_xlabel(simColName)
            ax.set_ylabel(obsColName)
            ax.scatter(simData, obsData, alpha=0.4)

            z1 = np.polyfit(simData, obsData, 1)
            p1 = np.poly1d(z1)
            if abs(z1[0]) > 0.3:
                x = np.linspace(simData.min(), simData.max(), 20)
                y = np.polyval(p1, x)
                ax.plot(x, y, '-', color='#ff7f0e')
            plotIndex += 1
    print('succeed')
elif argv['chart'] == 'Taylor diagram':
    if 'obsColName' not in locals().keys: 
        print('failed')
    stds = []
    rmsds = []
    coefs = []
    for i in range(columnNumber):
        if i == obsColIndex:
            stds.append(obsData.std())
            rmsds.append(0)
            coefs.append(1)
        else:
            simCol = df.iloc[:, i]
            simColName = df.columns[i]
            simData = simCol.values
            std = simCol.values.std()
            rmsd = sm.rmsd(simData, obsData)
            coef = np.ma.corrcoef(simData, obsData)[0, 1]
            
            stds.append(std)
            rmsds.append(rmsd)
            coefs.append(coef)
    sm.taylor_diagram(np.array(stds), np.array(rmsds), np.array(coefs),
        markerLabel = df.columns, rmslabelformat=':.1f')
    print('succeed')
elif argv['chart'] == 'Line chart':
    x = np.arange(rowNumber)
    for i in range(columnNumber):
        simCol = df.iloc[:, i]
        simColName = df.columns[i]
        simData = simCol.values
        plt.plot(x, simData, label=simColName)
    plt.legend()
    print('succeed')
elif argv['chart'] == 'Box diagram':
    seriesData = []
    for i in range(columnNumber):
        simCol = df.iloc[:, i]
        simColName = df.columns[i]
        simData = simCol.values
        seriesData.append(simData)
    # positions = np.arange(0, regionNum)*columnNumber + i - (seriesNum/2) + 0.5
    box = plt.boxplot(seriesData, sym='', widths=0.3)
    # percent = (i+1)/cmip.ncCount
    # color = cm.jet(percent)
    # set_box_color(box, color)
    plt.plot([], label=df.columns)
    print('succeed')

plt.savefig(argv['outputPath'], format='png', transparent=True)
plt.close('all')