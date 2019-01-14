import sys
import numpy as np
import pymongo
import matplotlib.pyplot as plt
import skill_metrics as sm
import json
import pandas as pd
from math import ceil

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

df = pd.read_csv(argv['inputFilePath'], header=0)
df = df.mask((df > METRIC['max']) | (df < METRIC['min']), np.nan)
if 'missing_value' in argv.keys():
    df.mask(df == METRIC['missing_value'], np.nan)

columnNumber = len(df.columns)
rowNumber = len(df)

for i, col in enumerate(df.columns):
    if col == 'Fluxdata':
        obsColIndex = i

if argv['chart'] == 'Scatter diagram' or argv['chart'] == 'Taylor diagram':
    if 'obsColIndex' not in locals().keys():
        print('can\'t find observation column, failed')
        sys.exit(1)
else:
    obsColIndex = -1

# get the mask
for i in range(columnNumber):
    masked = np.ma.array(df.iloc[:, i].values)
    masked = np.ma.masked_invalid(masked)
    if 'mask' not in locals().keys():
        mask = masked.recordmask
    else:
        mask = mask | masked.recordmask

# get masked data
obsLabel = ''
simColumns = []
simLabels = []
for i in range(columnNumber):
    if i == obsColIndex:
        obsColumn = np.ma.masked_array(df.iloc[:,i].values, mask=mask)
        obsColumn = np.ma.masked_invalid(obsColumn)
        obsLabel = df.columns[i]
    else:
        simLabels.append(df.columns[i])
        simColumn = np.ma.masked_array(df.iloc[:,i].values, mask=mask)
        simColumn = np.ma.masked_invalid(simColumn)
        simColumns.append(simColumn)
        
if argv['chart'] == 'Scatter diagram':
    # 多幅子图：每一幅是 simulation 和 observation 的散点图/回归直线
    plotColNumber = 1
    plotRowNumber = ceil(columnNumber/plotColNumber)
    plotIndex = 1
    # figH = 500
    # figW = 
    fig = plt.figure(figsize=(18, 30), tight_layout=True)

    for i in range(len(simColumns)):
        simColumn = simColumns[i]
        simLabel = simLabels[i]

        ax = fig.add_subplot(plotRowNumber, plotColNumber, plotIndex)
        ax.set_title(simLabel + '-' + obsLabel)
        plt.sca(ax)
        plt.tight_layout()
    
        # left, width = 0.1, 0.65
        # bottom, height = 0.1, 0.65
        # bottom_h = left_h = left + width + 0.02
        # rect_scatter = [left, bottom, width, height]
        # rect_histx = [left, bottom_h, width, 0.2]
        # rect_histy = [left_h, bottom, 0.2, height]
        # axScatter = 
        ax.set_xlabel(simLabel)
        ax.set_ylabel(obsLabel)
        ax.scatter(simColumn, obsColumn, alpha=0.4)

        z1 = np.ma.polyfit(simColumn, obsColumn, 1)
        p1 = np.poly1d(z1)
        # if abs(z1[0]) > 0.3:
        x = np.linspace(simColumn.min(), simColumn.max(), 20)
        y = np.polyval(p1, x)
        ax.plot(x, y, '-', color='#ff7f0e')
        plotIndex += 1
    print('succeed')
elif argv['chart'] == 'Taylor diagram':
    stds = []
    rmsds = []
    coefs = []
            
    labels = []
    stds.append(obsColumn.std())
    rmsds.append(0)
    coefs.append(1)
    labels.append('Fluxdata')
    for i in range(len(simColumns)):
        simColumn = simColumns[i]
        simColName = simLabels[i]
        labels.append(simColName)
        std = simColumn.std()
        rmsd = sm.rmsd(simColumn, obsColumn)
        coef = np.ma.corrcoef(simColumn, obsColumn)[0, 1]
        
        stds.append(std)
        rmsds.append(rmsd)
        coefs.append(coef)
    sm.taylor_diagram(np.array(stds), np.array(rmsds), np.array(coefs),
        markerLabel = labels, rmslabelformat=':.1f')
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
    data = [col.compressed() for col in simColumns]
    box = plt.boxplot(data, labels=simLabels)
    print('succeed')

plt.savefig(argv['outputPath'], format='png', transparent=True)
plt.close('all')