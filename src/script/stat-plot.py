import matplotlib as mpl
import matplotlib.pyplot as plt
plt.switch_backend('Agg')
import seaborn as sns
import numpy as np
import skill_metrics as sm
import pandas as pd
import sys, getopt
from os import path
import json

mpl.rc('font', size=10)
featureName = 'GPP'
sns.set()
        
def taylor(stds, rmses, coefs, labels, title):
    try:
        fpath = './src/script/data/taylor-' + title + '.jpg'
        sm.taylor_diagram(np.array(stds), np.array(rmses), np.array(coefs), 
            markerLabel = labels, markerLabelColor = 'r', markerSize = 6, markerLegend = 'on',
            colOBS = 'g', styleOBS = '-', markerobs = 'o',
            # tickRMS = np.arange(0,25,10), 
            # tickSTD = np.arange(9,20,5), 
            # tickCOR = intervalsCOR,
            showlabelsRMS = 'on', titleRMS = 'on', titleOBS = 'Fluxnet',
            rmslabelformat = ':.1f')
        plt.title(title, y=1.06, fontsize='large', loc='center', horizontalalignment='center')
        plt.savefig(fpath, format='jpg', transparent=False)
        plt.close('all')
    except Exception as instance:
        print(instance)

def heatmap(df, title):
    try:
        fpath = './src/script/data/heatmap-' + title + '.jpg'
        f,ax = plt.subplots(figsize=(10,5))
        fmt = lambda x,pos: round(x,2)
        sns.heatmap(df, annot=True, fmt='.2f', linewidths=.5,ax=ax, cmap='YlGnBu')
        plt.title(title)
        plt.savefig(fpath, format='jpg', transparent=False)
        plt.close('all')

    except Exception as instance:
        print(instance)
        
def plotTaylor():
    with open('./src/script/statistic-index-db.json') as load_f:
        stats = json.load(load_f)
        for stat in stats:
            title = featureName + '-' + stat['pft']
            labels = ['Fluxnet', 'IBIS', 'Biome-BGC', 'LPJ', 'MODIS', 'Fluxnet']
            stds = np.concatenate((np.array(stat['avg_std'][4:]), np.array(stat['avg_std'][:4])))
            rmses = np.concatenate((np.array([0]), np.array(stat['avg_rmsd'][:4])))
            coefs = np.concatenate((np.array([1]), np.array(stat['avg_coef'][:4])))
            taylor(stds, rmses, coefs, labels, title)
        print('--------finished')

def plotHeatmap():
    with open('./src/script/statistic-index-db.json') as load_f:
        stats = json.load(load_f)

        meanDict = {}
        stdDict = {}
        coefDict = {}
        r2sDict = {}
        rmseDict = {}
        for stat in stats:
            stat['avg_coef'] = np.array(stat['avg_coef'])
            stat['avg_r2'] = np.array(stat['avg_r2'])
            stat['avg_nse'] = np.array(stat['avg_nse'])
            stat['avg_coef'][stat['avg_coef']>1]=1
            stat['avg_r2'][stat['avg_r2']>1]=1
            stat['avg_nse'][stat['avg_nse']>1]=1
            stat['avg_coef'] = stat['avg_coef'].tolist()
            stat['avg_r2'] = stat['avg_r2'].tolist()
            stat['avg_nse'] = stat['avg_nse'].tolist()
            meanDict[stat['pft']] = stat['avg_mean']
            stdDict[stat['pft']] = stat['avg_std']
            coefDict[stat['pft']] = stat['avg_coef']
            r2sDict[stat['pft']] = stat['avg_r2']
            rmseDict[stat['pft']] = stat['avg_rmsd']
        pd_mean = pd.DataFrame(meanDict)
        pd_std = pd.DataFrame(stdDict)
        pd_coef = pd.DataFrame(coefDict)
        pd_r2s = pd.DataFrame(r2sDict)
        pd_rmse = pd.DataFrame(rmseDict)

        rowIndex = {0: 'IBIS', 1: 'Biome-BGC', 2: 'LPJ', 3: 'MODIS', 4: 'Fluxnet'}
        pd_mean.rename(index=rowIndex, inplace=True)
        pd_std.rename(index=rowIndex, inplace=True)
        pd_coef.rename(index=rowIndex, inplace=True)
        pd_r2s.rename(index=rowIndex, inplace=True)
        pd_rmse.rename(index=rowIndex, inplace=True)

        heatmap(pd_mean, featureName + '-mean')
        heatmap(pd_std, featureName + '-std')
        heatmap(pd_coef, featureName + '-coef')
        heatmap(pd_r2s, featureName + '-R2')
        heatmap(pd_rmse, featureName + '-rmse')
        print('--------finished')

try:
    # plotTaylor()
    plotHeatmap()


except Exception as instance:
    print(instance)
    sys.exit(1)



        