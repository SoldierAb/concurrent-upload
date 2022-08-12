# 大文件上传

## 场景分析

在业务场景中文件上传很普遍，而大文件的上传经常会导致上传时长过久，大量占用带宽资源，而分片上传就解决了目前的问题。

## 解决方案

### 前端 【[Concurrent](./web/src/utils/concurrent.js)】
- 获取文件进行分片
- 请求服务端过滤出未保存的分片
- 未保存分片上传 ` Promise限流 `【[PromiseLimit](./web/src/utils/promiseLimit.js) 】 
- 上传完毕，发送合并分片请求

### 后端接口 
- 保存分片
- 已保存的分片info获取
- 合并分片

## 快速开始

```bash
# server 初始化
$ cd server
$ go mod init file-split
$ go mod tidy

# 服务启动
$ go run .

# 前端启动
$ cd front 
$ yarn
$ yarn start

```

## 上传效果图
100M+ 文件分片上传 200ms内 完成 👇

![image](https://user-images.githubusercontent.com/33128022/184281365-22a50182-c400-48f1-8d09-db349aa3ac52.png)

不分片 大概 700ms+ 👇

<img width="753" alt="image" src="https://user-images.githubusercontent.com/33128022/184282019-c0bd9862-7cbb-4d24-b47e-e401d5fc2ed9.png">


```
