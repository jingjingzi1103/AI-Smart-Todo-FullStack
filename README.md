# Smart-Todo

这是一个集成了 **DeepSeek 大模型推理能力** 的全栈效能管理系统。  
系统围绕“任务拆解、优先级排序、执行追踪”构建，帮助用户把模糊目标快速转化为可执行计划。

## 项目简介

Smart-Todo 采用前后端分离架构：

- 后端提供任务管理、AI 推理、数据持久化等核心能力
- 前端提供任务录入、可视化列表与登录交互界面
- 数据库存储任务、用户与系统行为数据

## AI 功能亮点（重点）

### 1) 模糊语义解析

当用户输入如“下周有个考试”这类自然语言时，后端会调用 DeepSeek 模型进行语义理解与任务拆解，自动生成更可执行的子任务，例如：

- 整理大纲
- 复习旧课
- 模拟测试

这样可以显著降低用户规划门槛，让“想法”快速变成“行动清单”。

### 2) 智能任务优先级

系统会基于任务描述、紧急程度和语义信息，通过 AI 自动评分并排序任务优先级，帮助用户先做最重要的事，提高整体执行效率。

## 技术架构

### 后端

- Spring Boot
- Gradle
- MySQL
- DeepSeek SDK / API 调用

### 前端

- React
- TypeScript
- Ant Design / Tailwind

## 目录结构

```text
Smart-Todo/
├─ web_backend/     # Java Spring Boot 后端
└─ web_frontend/    # React 前端
```

## 快速启动

### 1. 后端启动（IDEA）

后端需要在 IntelliJ IDEA 中运行主启动类文件：

`web_backend/src/main/java/redlib/backend/WebBackendApplication.java`

运行方式：

1. 用 IDEA 打开 `web_backend`
2. 找到 `WebBackendApplication` 类
3. 点击运行（Run）启动 Spring Boot 服务
4. 到web_backend/src/main/resources/application.properties中添加deepseek API key

### 2. 前端启动（终端）

进入 `web_frontend` 目录后，按顺序执行以下命令：

```bash
npm install
npm run openapi
npm start
```

执行完成后会弹出前端界面，然后即可进入登录页面进行使用。

## 数据库说明

- 数据库类型：MySQL
- 默认库名：`demo`
- 初始化脚本：`web_backend/data/demo.sql`
- 连接配置文件：`web_backend/src/main/resources/application.properties`

如首次运行，请先创建数据库并导入 SQL 脚本，再启动后端服务。

### 数据库创建与后端连接（推荐手动配置）

如果你之前是自己手动建库并连接后端，README 里建议保留下面这套流程，方便复现：

1. 启动本地 MySQL 服务（确保 `3306` 可用）。
2. 创建数据库 `demo`：

```sql
CREATE DATABASE demo DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
```

3. 导入初始化脚本 `web_backend/data/demo.sql`（可用 Navicat、DataGrip 或 mysql 命令行）。
4. 打开 `web_backend/src/main/resources/application.properties`，确认以下配置与本机一致：
   - `spring.datasource.url=jdbc:mysql://127.0.0.1:3306/demo...`
   - `spring.datasource.username=你的数据库用户名`
   - `spring.datasource.password=你的数据库密码`
5. 在 IDEA 运行 `WebBackendApplication`，观察控制台是否出现启动成功日志。
6. 如连接失败，优先排查：
   - MySQL 账号密码是否正确
   - `demo` 数据库是否已创建并成功导入表
   - 3306 端口是否被占用或被防火墙拦截
   - JDBC URL 中时区、编码参数是否被误改

## 开发说明

- 前后端联调时，请确保后端服务先启动
- 若接口请求异常，请检查后端端口与前端代理配置是否一致
- 建议将 AI Key 放在环境变量中，避免明文写入仓库
