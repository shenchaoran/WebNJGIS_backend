interface IComparisonTaskCtrl {
    startComparison()
    dispatchTasks()
    monitorTask()
    statResults()
    visualResults()
    pushData()
    pullData()
    getInstanceProgress()
    killInstance()
}

interface IModelServiceCtrl {
    pushData()
    pullData()
    startModel()
    getInstanceProgress()
    killInstance()
}

interface IDataServiceCtrl {
    download(dataStub)
    upload(dataStub)
    unitConversion(srcDataStub, 
	  distDataStub, unitRefer)
    dataExtraction(srcDataStub, 
	  distDataStub, 
	  dataType: 'table' | 'NETCDF4')
    dataCombination(srcDataStubs, distDataStub)
    getInstanceProgress(instanceId)
    killInstance()
}

interface WorkflowDriver {
    start()             // 启动对比任务
    invokeService()     // 调用服务
    scanProgress()      // 监控服务运行进度和状态
    isServiceReady()    // 判断服务数据准备情况
    fetchData()         // 从远程获取数据
    pushData()          // 将结果数据推送到远程服务器节点
    addDataStubs()      // 增加数据存根
}