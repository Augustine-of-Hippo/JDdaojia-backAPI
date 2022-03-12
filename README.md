# JDdaojia-backAPI
### 简介

这是JDdaojia项目的后端api接口部分. 前端仓库地址: [JDdaojia](https://github.com/Augustine-of-Hippo/JDdaojia) .

本程序把商城的账户、商铺和地址等数据分别储存在不同的json文件中,服务器接收到http请求后会用node原生fs模块从文件中提取信息,进行增删查改后再覆写文件.用这种方式为前端提供后端数据接口的交互操作,如登录、下单、查询订单、修改地址等.每次服务器开启时都会将相关的数据文件初始化,以抹除上一次运行的修改.

### 所用技术
[NodeJS](https://github.com/nodejs/nodejs.dev) - [Express](https://github.com/expressjs/expressjs.com)

### 本地开发运行
1. 安装node: 见 [How to install Node.js](https://nodejs.dev/learn/how-to-install-nodejs) .
2. 运行
   ``npm install``
   安装项目 .
3. (可选) 在index.js文件中把运行端口设为想要的数值, 初始值为3000 .
4. 运行
   ``node index.js``
   开启后端接口服务器 .
5. 打开前端程序,享受前后端交互的乐趣 .


### 注意事项
+ 本程序使用了cors模块来解决同源问题,如果仍有同源问题请查看http相关标头信息,以进一步寻求解决方法.
+ 可以通过预设账户 **用户名: admin 密码: admin** 来直接登录商城.
+ 本程序没有使用标准的http状态码来表示业务结果,而是用200状态码和响应体中的errno数字以及msg错误信息来表示操作结果,具体的信息在index.js中有注释说明.但文件中仍留下了使用标准状态码的封装代码,可以另行利用.




