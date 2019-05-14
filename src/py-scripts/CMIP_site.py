import sys
import numpy as np
# import pymongo
import matplotlib.pyplot as plt
plt.switch_backend('Agg')
import skill_metrics as sm
import json
import pandas as pd
from math import ceil
# import matplotlib as mpl
import seaborn as sns
# from sklearn.model_selection import train_test_split
from sklearn.linear_model import LinearRegression
# from sklearn import metrics

# {
#     inputFilePath,
#     chart: 'scatter' | 'line' | 'taylor' | 'box' | 'statistical index',
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
# js写文件时 null 变成空了，只有逗号分隔符
# df.replace({'null': np.nan, 'None': np.nan, 'NaN': np.nan, 'nan': np.nan})
# df_noNaN = df.dropna()
# df_noZero = df_noNaN.mask(df == 0)
# df_noZero = df_noZero.dropna()
colN = df.shape[1]
rowN = df.shape[0]

for i, col in enumerate(df.columns):
    if col == 'Fluxnet':
        iObs = i
if chart == 'Scatter diagram' or chart == 'Taylor diagram' or chart == 'SE' or chart == 'statistical index':
    if 'iObs' not in locals().keys():
        print('can\'t find observation column, failed')
        sys.exit(1)
else:
    iObs = -1

# 需要删除 nan/zero
# if chart == 'Line chart':
#     df = df
# elif metricName == 'NEE' or metricName == 'NEP' or chart == 'statistical index':
# else:
    # df = df_noNaN
# else:
#     df = df_noMissingV


def getStatisticalIndex():
    result = {
        'means': [],
        'stds': [],
        'rmses': [],
        'coefs': [],
        'nses': [],
        'r2s': [],
        'labels': []
    }
    for i in range(colN):
        if i != iObs:
            simLabel = df.columns[i]
            thisDF = df.dropna(subset=[simLabel, df.columns[iObs]])
            simCol = thisDF[simLabel]
            obsCol = thisDF[df.columns[iObs]]

            std = simCol.std()
            mean = simCol.mean()
            if simCol.any():
                rmse = sm.rmsd(simCol, obsCol)
                coef = np.corrcoef(simCol, obsCol)[0, 1]
                nse = 1 - sum((simCol - obsCol)**2)/sum((obsCol - obsCol.mean())**2)
                r2 = coef**2
            else:
                rmse = np.NaN
                coef = np.NaN
                nse = np.NaN
                r2 = np.NaN

            result['means'].append(mean)
            result['labels'].append(simLabel)
            result['stds'].append(std)
            result['rmses'].append(rmse)
            result['coefs'].append(coef)
            result['nses'].append(nse)
            result['r2s'].append(r2)
        else:
            result['means'].append(obsCol.mean())
            result['labels'].append('Fluxnet')
            result['stds'].append(obsCol.std())
            result['rmses'].append(0)
            result['coefs'].append(1)
            result['nses'].append(0)
            result['r2s'].append(1)
    
    jsonStr = json.dumps(result).replace('NaN', 'null')
    print(jsonStr)

def sePlot():
    nyear_sum = round(rowN*argv['timeInterval']/365)
    df_noNaN = df.dropna()
    if df_noNaN.shape[0] == 0:
        print('no data after drop nan')
        sys.exit(1)
    if nyear_sum == 1:
        print('only 1 year of observation data, cann\'t set up train-dataset')
        sys.exit(1)
    else:
        nyear_train = nyear_sum - 1
        nday_train = round(nyear_train*365/argv['timeInterval'])
        df_train = df_noNaN[:nday_train]
        df_test = df_noNaN[nday_train:]
        xloc_train = []
        xLabels = []
        for i, col in enumerate(df_noNaN.columns):
            if col == 'IBIS site' or col == 'Biome-BGC site' or col == 'LPJ site':
                xloc_train.append(i)
                xLabels.append(col)
        # df_noNaN:
        #        0           1               2           3
        #        IBIS        Biome-BGC       LPJ         observation
        #     0  x_train     x_train         x_train     y_train
        #     1  x_test      x_test          x_test      y_text

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
            'Fluxnet': y_test
        }
        # for i in range(x_test.shape[1]):
        #     dataset[x_test.columns[i]] = x_test.iloc[:,i]
        plt.figure(figsize=(8, 10))
        sns.lineplot(data=pd.DataFrame(dataset))
        plt.savefig(argv['outputPath'])
        plt.close('all')
        
        # sum_mean=0
        # for i in range(len(y_pred)):
        #     sum_mean+=(y_pred[i] - y_test.values[i])**2
        # RMSE = np.sqrt(sum_mean/len(y_pred))
        # print('RMSE: ', RMSE)
        # print(chart, 'succeed')

def snsPlot(chart):
    if chart == 'Line chart':
        # 不能删除 nan
        sns.lineplot(data=df)
    elif chart == 'Box diagram':
        # 需要删除 nan
        sns.boxplot(data=df, width=0.45)
    elif chart == 'Violin diagram':
        # 需要删除 nan
        sns.violinplot(data=df)
    # print(chart, 'succeed')
    plt.savefig(argv['outputPath'])
    plt.close('all')

def taylorPlot():
    obsCol = df.iloc[:, iObs]
    stds = []
    rmses = []
    coefs = []
    labels = []
    stds.append(obsCol.std())
    rmses.append(0)
    coefs.append(1)
    labels.append('Fluxnet')
    for i in range(colN):
        if i != iObs:
            simLabel = df.columns[i]
            thisDF = df.dropna(subset=[simLabel, df.columns[iObs]])
            simCol = thisDF[simLabel]
            obsCol = thisDF[df.columns[iObs]]
            
            if simCol.any():
                std = simCol.std()
                rmse = sm.rmsd(simCol, obsCol)
                coef = np.corrcoef(simCol, obsCol)[0, 1]
                
                stds.append(std)
                rmses.append(rmse)
                coefs.append(coef)
                labels.append(simLabel)
            else:
                pass
        else:
            pass
        
    sm.taylor_diagram(np.array(stds), np.array(rmses), np.array(coefs), 
        markerLabel = labels, markerLabelColor = 'r', markerSize = 6, markerLegend = 'on',
        colOBS = 'g', styleOBS = '-', markerobs = 'o',
        showlabelsRMS = 'on', titleRMS = 'on', titleOBS = 'Fluxnet',
        rmslabelformat=':.1f')
    plt.title(metricName, y=1.06, fontsize='large', loc='center', horizontalalignment='center')
    plt.savefig(argv['outputPath'])
    plt.close('all')
    # print(chart, 'succeed')
    # except Exception as instance:
    #     sys.stderr.write(json.dumps(sys.argv[1]))
    #     sys.stderr.write(instance)

def scatterPlot():
    plotColN = 1
    plotRowN = ceil((colN-1)/plotColN)
    plotIndex = 1
    # figH = 500
    # figW = 500
    fig = plt.figure(figsize=(18, 30))
    obsLabel = df.columns[iObs]
    # 多幅子图：每一幅是 simulation 和 observation 的散点图/回归直线
    for i in range(colN):
        if i != iObs:
            simLabel = df.columns[i]
            thisDF = df.dropna(subset=[simLabel, df.columns[iObs]])
            simCol = thisDF[simLabel]
            obsCol = thisDF[df.columns[iObs]]

            ax = fig.add_subplot(plotRowN, plotColN, plotIndex)
            ax.set_title(simLabel + '-' + obsLabel)
            
            plt.sca(ax)
            plt.tight_layout()
        
            # TODO unit
            ax.set_xlabel(simLabel)
            ax.set_ylabel(obsLabel)
            if simCol.shape[0]!=0:
                sns.regplot(x=simLabel, y='Fluxnet', data={'Fluxnet': obsCol, simLabel: simCol})
                plotIndex += 1
            else:
                pass

        else:
            pass
    # print(chart, 'succeed')
    plt.savefig(argv['outputPath'])
    plt.close('all')
        

try:
    if chart == 'Scatter diagram':
        scatterPlot()
    elif chart == 'Taylor diagram':
        taylorPlot()
    elif chart == 'Line chart' or chart == 'Box diagram' or chart == 'Violin diagram':
        snsPlot(chart)
    elif chart == 'SE':
        sePlot()
    elif chart == 'statistical index':
        getStatisticalIndex()
except Exception as instance:
    sys.stderr.write(json.dumps(sys.argv[1]))
    sys.stderr.write(instance)
    sys.exit(1)