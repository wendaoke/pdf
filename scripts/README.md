# PDF 合并 · 开发与部署脚本

脚本目录：`仓库根/scripts/`。后端为 Maven 多模块 `backend/pdf-merge`，前端为 `frontend/pdf-merge-web`（Next.js `output: "standalone"`）。

## 依赖速查

| 组件 | 要求 |
|------|------|
| 后端 | JDK 21+、Maven 3.9+、MySQL、Redis（与 `application.yml` 一致） |
| 前端 | Node.js 18+、npm |
| 打包产物 | 运行需 JRE 21+；前端为 `node server.js`（standalone） |

默认端口：API **8080**，Next **3000**（可用环境变量 `FRONTEND_PORT` 修改）。

---

## 一、本地开发

### Windows（推荐）

| 脚本 | 说明 |
|------|------|
| `start-local-dev.bat` | 一键：新开两个窗口跑 **API + Worker**（Maven），当前窗口约 8 秒后跑 **Next dev** |
| `start-local-dev-backend.bat` | 仅后端；可选第 1 参：外置 `application.yml` 绝对路径 |
| `start-local-dev-frontend.bat` | 仅前端；缺 `node_modules` 会自动 `npm install`；端口 `FRONTEND_PORT`（默认 3000） |
| `stop-local-dev-backend.bat` | 说明如何关掉上述 Maven 窗口（无自动杀进程） |

前端联调地址见：`frontend/pdf-merge-web/.env.development`（如 `NEXT_PUBLIC_MERGE_API_BASE`）。

### Linux / macOS

| 脚本 | 说明 |
|------|------|
| `./scripts/start-local-dev.sh` | 一键：后端 **nohup** 写日志到 `logs/local-dev/`，再前台 `npm run dev` |
| `./scripts/start-local-dev-backend.sh` | 仅后端；可选外置 yml；**勿重复启动**（有 pid 文件） |
| `./scripts/start-local-dev-frontend.sh` | 仅前端 |
| `./scripts/stop-local-dev-backend.sh` | 按 `logs/local-dev/*.pid` 结束 API / Worker |

---

## 二、打包发布产物

将 **可执行 jar + Next standalone** 输出到 **`dist/pdf-merge-deploy/`**：

| 平台 | 命令 |
|------|------|
| Windows | `scripts\build-deploy.bat` 或 `scripts\build-deploy.bat build`（仅构建不拷贝） |
| Linux/macOS | `./scripts/build-deploy.sh` 或 `./scripts/build-deploy.sh build` |

子命令（仅 bat 三合一；sh 为 `build` | `package`）：

- **build**：`mvn clean package -DskipTests` + `npm install` + `npm run build`
- **package**（默认）：在 build 基础上拷贝 `pdf-merge-api.jar`、`pdf-merge-worker.jar`、生产用 `*.sh` 与示例配置到 `dist/...`，并复制 `.next/standalone` 与 `static`、`public`

产物结构示例：

```text
dist/pdf-merge-deploy/
  backend/   pdf-merge-api.jar, pdf-merge-worker.jar, start-backend-prod.sh, stop-backend-prod.sh, …
  frontend/  server.js, .next/static, …
  DEPLOY_HINT.txt
```

---

## 三、现场 / 本机跑「打包结果」

### Windows

1. 先执行：`scripts\build-deploy.bat package`
2. 启动：`scripts\start-prod.bat [外置yml路径] [NEXT_PUBLIC_MERGE_API_BASE]`  
   - 默认 yml：`dist\pdf-merge-deploy\config\application.yml`（不存在则从模板生成）  
   - 默认 API：`http://localhost:8080/api/v1/pdf/merge`
3. 停止：`scripts\stop-prod.bat`；重启：`scripts\restart-prod.bat`（参数同 start）

`start-prod.bat` 会打开三个 **cmd** 窗口（API、Worker、Node）。仅后端可参考 `dist\...\backend\` 内说明使用 `start-backend-prod.sh`（Linux）或自行 `java -jar`。

### Linux / macOS

1. `chmod +x scripts/*.sh dist/pdf-merge-deploy/backend/*.sh`
2. `./scripts/build-deploy.sh package`
3. `./scripts/start-prod.sh [config.yml] [NEXT_PUBLIC_MERGE_API_BASE]`
4. `./scripts/stop-prod.sh`；`./scripts/restart-prod.sh`

后端日志：`dist/pdf-merge-deploy/backend/logs/`；前端：`dist/pdf-merge-deploy/logs/frontend.log`。

---

## 四、与 `build-deploy.bat deploy` 的区别

`build-deploy.bat deploy` 会在 **package** 后尝试用 `java -jar` 与 `node server.js` **直接拉起进程**（适合本机冒烟）。生产环境建议：**先 package，再拷贝整个 `dist/pdf-merge-deploy` 到服务器**，用 `start-prod` / `start-backend-prod.sh` 并外置配置。

---

## 五、配置与安全

- 示例：`scripts/application-prod.yml.example` → 复制为现场 `application.yml`，填写 MySQL、Redis、`pdfmerge.storage.root-dir` 等。
- **勿**将含密码的 yml 提交到 Git；客户环境用外置路径传入启动脚本。

---

*与仓库内 `doc/04-后端/deployment/` 文档可交叉引用。*
