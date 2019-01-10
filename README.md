# 项目简介

# 用户指南

# 开发者指北
## install
- Install [Node.js](https://nodejs.org/en/)
- Install [MongoDB](https://docs.mongodb.com/manual/installation/)
- Install [VS Code](https://code.visualstudio.com/)

```
git clone --depth=1 https://github.com/shenchaoran/WebNJGIS_backend.git <project_name>
cd <project_name>
npm install
mongod
npm start
```

@types/request 包因版本原因要改一下:
```
//types/request/index.d.ts
toJSON(): Object;
// 改为
toJSON(): object;
```

Navigate to `http://localhost:9999`

## Architecture
- 基于中间件的后台开发
- 异步流程全部采用 `Promise` 或者 `async`
- pre-middleware: 对应用级或路由级中间件统一处理
- post-middleware: 对response和error统一处理（除了下载文件这种特殊情况）
- controllers: 业务逻辑处理，有部分文件可以当做所有nodejs后台程序都通用的，比如：
    - child-process.controller: 启动子进程运行一块js代码，在调用端通过`process.on`监听并执行
    - request.controller: 通过后台发送get和post请求，这里对request进行了封装，以满足通常场景
- utils: 工具库
- init: 后台程序初始化操作，创建文件夹结构，初始化数据库，连接远程服务器等...
- config: 包括后台通用配置和远程请求API的配置
- routes: `base.route`对路由进行了封装，在创建路由器时可以可选地直接创建增删查改路由，当然也可以自己不用默认的

## TODO
- [ ] 数据库重新设计
    - [ ] 去除 Geo_data DB
    - [ ] UserModel 中的 avator 存到文件系统中
    - [ ] nodeDB 添加一些软硬件环境信息
- [ ] bug: 数据缓存，异步流程控制，返回给前台的是空的
- [ ] bug: Biome-BGC ini 配置文件，输出控制全部设为 1

## 数据处理
actual data value (schema unit) = data value * schema scale + schema offset