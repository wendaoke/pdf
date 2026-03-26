# 后端开发文档

本目录存放后端开发相关文档，由后端开发工程师维护。

## 子目录说明

| 目录 | 说明 |
|------|------|
| `api/` | 接口定义文档 (OpenAPI/Swagger) |
| `database/` | 数据库设计文档 |
| `services/` | 微服务/模块设计说明 |
| `deployment/` | 部署与运维文档 |

## 核心模块

### PDF 转换服务
- PDF ↔ Word 转换
- PDF ↔ Excel 转换
- PDF ↔ PPT 转换
- PDF ↔ 图片转换

### PDF 编辑服务
- PDF 合并
- PDF 拆分
- PDF 压缩
- PDF 页面管理

## 文档清单

- [x] API 接口规范（通用）：`api/接口规范.md`
- [x] API 接口规范（PDF 合并 MVP）：`api/PDF合并-MVP-接口(Java).md`
- [x] 数据库表结构设计（通用）：`database/数据库结构说明.md`
- [x] 数据库表结构设计（PDF 合并 MVP）：`database/PDF合并-MySQL-DDL.sql`
- [x] 任务队列设计（PDF 合并 MVP）：`services/PDF合并-RedisStream设计.md`
- [x] 模块拆分（PDF 合并 MVP）：`services/PDF合并-模块拆分.md`
- [x] Spring Boot 启动骨架（PDF 合并 MVP）：`services/PDF合并-SpringBoot启动骨架.md`
- [x] Maven POM 模板（PDF 合并 MVP）：`services/PDF合并-Maven依赖清单.md`
- [x] Java 类骨架（PDF 合并 MVP）：`services/PDF合并-Java代码骨架.md`
- [x] 部署配置模板（PDF 合并 MVP）：`deployment/PDF合并-应用配置模板.yml`
