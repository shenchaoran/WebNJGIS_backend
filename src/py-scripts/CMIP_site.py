import sys
import numpy as np
import pymongo
import matplotlib.pyplot as plt
import skill_metrics as sm
import json
import pandas as pd
from math import ceil
import matplotlib as mpl
import seaborn as sns
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LinearRegression
from sklearn import metrics

# {
#     inputFilePath,
#     chart: 'scatter' | 'line' | 'taylor' | 'box',
#     outputPath,
#     missing_value,
#     header,
#     metricName,
#     timeInterval,
# }

sns.set()
argv = json.loads(sys.argv[1])
metricName = argv['metricName']
chart = argv['chart']
df = pd.read_csv(argv['inputFilePath'], header=0)
df_noNaN = df.dropna()
df_noZero = df_noNaN.mask(df == 0)
df_noZero = df_noZero.dropna()
colN = df.shape[1]
rowN = df.shape[0]

for i, col in enumerate(df.columns):
    if col == 'Fluxdata':
        iObs = i
if chart == 'Scatter diagram' or chart == 'Taylor diagram' or chart == 'SE':
    if 'iObs' not in locals().keys():
        print('can\'t find observation column, failed')
        sys.exit(1)
else:
    iObs = -1

# 需要删除 nan/zero
if chart == 'Line chart':
    thisDF = df
elif metricName == 'NEE' or metricName == 'NEP':
    thisDF = df_noNaN
else:
    thisDF = df_noZero

def sePlot():
    nyear_sum = round(rowN*argv['timeInterval']/365)
    nyear_train = nyear_sum - 1
    nday_train = round(nyear_train*365/argv['timeInterval'])
    df_train = df[:nday_train]
    df_test = df[nday_train:]
    xloc_train = []
    xLabels = []
    for i, col in enumerate(df.columns):
        if col == 'IBIS site' or col == 'Biome-BGC site' or col == 'LPJ site':
            xloc_train.append(i)
            xLabels.append(col)
    x_train = df_train.iloc[:, xloc_train]
    y_train = df_train.iloc[:, iObs]
    x_test = df_test.iloc[:, xloc_train]
    y_test = df_test.iloc[:, iObs]
    y_avg = x_test.mean(axis=1)
    linreg = LinearRegression()
    model = linreg.fit(x_train, y_train)
    B = list(zip(xLabels, linreg.coef_))
    y_pred = linreg.predict(x_test)
    dataset = {
        'SE': y_pred, 
        'EE': y_avg, 
        'Fluxdata': y_test
    }
    for i in range(x_test.shape[1]):
        dataset[x_test.columns[i]] = x_test.iloc[:,i]
    plt.figure(figsize=(8, 10))
    sns.lineplot(data=pd.DataFrame(dataset))
    plt.savefig(argv['outputPath'])
    plt.close('all')
    
    sum_mean=0
    for i in range(len(y_pred)):
        sum_mean+=(y_pred[i] - y_test.values[i])**2
    RMSE = np.sqrt(sum_mean/len(y_pred))
    print('RMSE: ', RMSE)

    print('succeed')

def snsPlot(chart):
    if chart == 'Line chart':
        # 不能删除 nan
        sns.lineplot(data=thisDF)
    elif chart == 'Box diagram':
        # 需要删除 nan
        sns.boxplot(data=thisDF, width=0.45)
    elif chart == 'Violin diagram':
        # 需要删除 nan
        sns.violinplot(data=thisDF)
    print('succeed')
    plt.savefig(argv['outputPath'])
    plt.close('all')

def taylorPlot():
    obsCol = thisDF.iloc[:, iObs]
    stds = []
    rmsds = []
    coefs = []
    labels = []
    stds.append(obsCol.std())
    rmsds.append(0)
    coefs.append(1)
    labels.append('Fluxdata')
    for i in range(colN):
        if i == iObs:
            pass
        simCol = thisDF.iloc[:, i]
        simLabel = thisDF.columns[i]
        labels.append(simLabel)
        std = simCol.std()
        rmsd = sm.rmsd(simCol, obsCol)
        coef = np.corrcoef(simCol, obsCol)[0, 1]
        
        stds.append(std)
        rmsds.append(rmsd)
        coefs.append(coef)
    sm.taylor_diagram(np.array(stds), np.array(rmsds), np.array(coefs), markerLabel = labels, rmslabelformat=':.1f')
    print('succeed')
    plt.savefig(argv['outputPath'])
    plt.close('all')

def scatterPlot():
    plotColN = 1
    plotRowN = ceil((colN-1)/plotColN)
    plotIndex = 1
    # figH = 500
    # figW = 500
    fig = plt.figure(figsize=(18, 30))
    obsCol = thisDF.iloc[:, iObs]
    obsLabel = thisDF.columns[iObs]
    # 多幅子图：每一幅是 simulation 和 observation 的散点图/回归直线
    for i in range(colN):
        if i == iObs:
            continue
        simCol = thisDF.iloc[:, i]
        simLabel = thisDF.columns[i]

        ax = fig.add_subplot(plotRowN, plotColN, plotIndex)
        ax.set_title(simLabel + '-' + obsLabel)
        
        plt.sca(ax)
        plt.tight_layout()
    
        # TODO unit
        ax.set_xlabel(simLabel)
        ax.set_ylabel(obsLabel)
        sns.regplot(x=simLabel, y='Fluxdata', data={'Fluxdata': obsCol, simLabel: simCol})

        plotIndex += 1
    print('succeed')
    plt.savefig(argv['outputPath'])
    plt.close('all')
        
if chart == 'Scatter diagram':
    scatterPlot()
elif chart == 'Taylor diagram':
    taylorPlot()
elif chart == 'Line chart' or chart == 'Box diagram' or chart == 'Violin diagram':
    snsPlot(chart)
elif chart == 'SE':
    sePlot()
