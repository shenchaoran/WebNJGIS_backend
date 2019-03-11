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
sns.set()

dbPath = '/home/scr/Projects/CMIP_backend/src/script/data/sites-stat.json'
           
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
        # plt.title(title, y=1.06, fontsize='large', loc='center', horizontalalignment='center')
        plt.tight_layout()
        plt.savefig(fpath, format='jpg', transparent=False)
        plt.close('all')
    except Exception as instance:
        print(instance)

def heatmap(df, title):
    try:
        fpath = './src/script/data/heatmap-' + title + '.jpg'
        fig, ax = plt.subplots(figsize=(8,5))
        fmt = lambda x,pos: round(x,2)
        sns.heatmap(df, annot=True, fmt='.2f', linewidths=.5,ax=ax, cmap='YlGnBu')
        # plt.yticks(rotation=90)
        plt.tight_layout()
        # ax.set_xlabel('PFT')
        # ax.set_ylabel(title)
        fig.subplots_adjust(left=.15, bottom=.15)
        fig.text(0.515, 0.03, 'Observed ' + featureName + ' (kgC m-2 y-1)', ha="center", va="center")
        fig.text(0.03, 0.5, featureName + ' (kgC m-2 y-1)', ha="center", va="center", rotation=90)
        # plt.title(title)
        plt.savefig(fpath, format='jpg', transparent=False)
        plt.close('all')
        

    except Exception as instance:
        print(instance)

def plotTaylor():
    with open(dbPath) as load_f:
        stats = json.load(load_f)
        for stat in stats:
            title = featureName + '-' + stat['pft']
            labels = ['Fluxnet', 'IBIS', 'Biome-BGC', 'LPJ', 'MODIS']
            stds = np.concatenate((np.array(stat['avg_std'][4:]), np.array(stat['avg_std'][:4])))
            rmses = np.concatenate((np.array([0]), np.array(stat['avg_rmse'][:4])))
            coefs = np.concatenate((np.array([1]), np.array(stat['avg_coef'][:4])))
            taylor(stds, rmses, coefs, labels, title)
        print('--------finished')

def plotHeatmap():
    with open(dbPath) as load_f:
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
            rmseDict[stat['pft']] = stat['avg_rmse']
        pd_mean = pd.DataFrame(meanDict)*.365
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

def plotBar():
    with open(dbPath) as load_f:
        stats = json.load(load_f)

        meanDict = {}
        for stat in stats:
            meanDict[stat['pft']] = stat['avg_mean']
        pd_mean = pd.DataFrame(meanDict)*.365

        rowIndex = {0: 'IBIS', 1: 'Biome-BGC', 2: 'LPJ', 3: 'MODIS', 4: 'Fluxnet'}
        pd_mean.rename(index=rowIndex, inplace=True)
        pd_mean.columns.name='PFT'
        pd_mean.index.name='model'
        data = pd_mean.stack().reset_index(name='val')
        # print(data)
        sns.barplot(x='PFT', y='val', hue='model', data=data)

        # fig, axes = plt.subplots(nrows=pd_mean.index.shape[0], ncols=1, sharex=True)
        # axes=axes.flatten()
        # for i, rowName in enumerate(pd_mean.index):
        #     ax = axes[i]
        #     if i!=0:
        #         ax
        #     sns.barplot(x=pfts, y=pd_mean.loc[rowName], ax=ax)
        #     ax.set_ylabel(rowIndex[i])
        #     # ax.set_xlabel('Observed ' + featureName + ' (kgC m-2 y-1)')
        # fig.tight_layout(h_pad=0)
        # fig.subplots_adjust(left=.15, bottom=.15)
        # fig.text(0.515, 0.03, 'Observed ' + featureName + ' (kgC m-2 y-1)', ha="center", va="center")
        # fig.text(0.03, 0.5, featureName + ' (kgC m-2 y-1)', ha="center", va="center", rotation=90)

        fpath = './src/script/data/bar-' + featureName + '-mean.jpg'
        plt.xlabel('PFT')
        plt.ylabel('mean ' + featureName + ' (kgC m-2 y-1)')
        plt.savefig(fpath, format='jpg')
        plt.close('all')
        print('--------finished')

def gridScatter():
    with open(dbPath) as load_f:
        stats = json.load(load_f)
        means = []
        pft = []
        for stat in stats:
            for mean in stat['means']:
                if len(mean) == 5:
                    # mean.append(stat['pft'])
                    pft.append(stat['pft'])
                    means.append(mean)
        cols = ['IBIS', 'Biome-BGC', 'LPJ', 'MODIS', 'Fluxnet']
        df = pd.DataFrame(means, columns=cols)
        df.iloc[:,[0,1,2,3,4]] *=.365
        # df = df[(df.PFT == 'GRA') | (df.PFT == 'SAV') | (df.PFT == 'WSA')]
        obs = df.iloc[:, 4].tolist()
        df = df.iloc[:, [0,1,2,3]]
        df.columns.name = 'Model'
        df.index.name = 'site'
        df = df.stack().reset_index(name='Simulated')
        df['Fluxnet'] = obs*4
        df['PFT'] = pft*4
        g = sns.FacetGrid(df, col='Model', hue='PFT', col_wrap=2, sharex=False, sharey=False)
        g.map(sns.scatterplot, 'Simulated', 'Fluxnet')
        g.add_legend()
        for i, ax in enumerate(g.axes):
            ax.set_xlabel('')
            ax.set_ylabel('')
            ax.set_title(cols[i])
        
        g.fig.text(0.515, 0.03, 'Simulated %s (kgC m-2 y-1)' % featureName, ha="center", va="center")
        g.fig.text(0.03, 0.5, 'Observed %s (kgC m-2 y-1)' % featureName, ha="center", va="center", rotation=90)
        plt.savefig('./src/script/data/scatter-' + featureName + '.jpg')
        plt.close('all')
        print('finished scatter')

# 站点散点图
def plotScatter():
    with open(dbPath) as load_f:
        stats = json.load(load_f)
        means = []
        for stat in stats:
            for mean in stat['means']:
                if len(mean) == 5:
                    mean.append(stat['pft'])
                    means.append(mean)
        cols = ['IBIS', 'Biome-BGC', 'LPJ', 'MODIS', 'Fluxnet', 'PFT']
        df = pd.DataFrame(means, columns=cols)
        df.iloc[:,[0,1,2,3,4]] *=.365
        # df = df[(df.PFT == 'GRA') | (df.PFT == 'SAV') | (df.PFT == 'WSA')]
        fig, axes = plt.subplots(nrows=2, ncols=2, sharex=True)
        axes = axes.flatten()
        for i, col in enumerate(cols):
            if col != 'Fluxnet' and col != 'PFT':
                ax=axes[i]
                if i == 0:
                    legend = 'brief'
                else:
                    legend = False
                a = sns.scatterplot(x=col, y='Fluxnet', data=df, hue='PFT', ax=ax, legend=legend)
                sns.regplot(x=col, y='Fluxnet', data=df, ax=ax)
                ax.set_ylabel('')    
                ax.set_xlabel('')
                ax.set_title(col)
        # fig.add_axes([.8, .1, .2, .8])
        plt.legend()
        fig.tight_layout(h_pad=0)
        fig.subplots_adjust(left=.17, bottom=.15)
        fig.text(0.515, 0.03, 'Observed ' + featureName + ' (kgC m-2 y-1)', ha="center", va="center")
        fig.text(0.03, 0.5, featureName + ' (kgC m-2 y-1)', ha="center", va="center", rotation=90)
        plt.savefig('./src/script/data/scatter-' + featureName + '.jpg')
        plt.close('all')
        print('finished scatter')

featureName = 'GPP'
# try:
# plotTaylor()
# plotHeatmap()
# plotScatter()
# plotBar()
gridScatter()



# except Exception as instance:
#     print(instance)
#     sys.exit(1)



        