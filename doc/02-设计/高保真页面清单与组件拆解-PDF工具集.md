# PDF工具集 高保真页面清单与组件拆解（前端可实现粒度）

## 1. 文档目标

本文件用于让前端团队可直接开工，实现从页面到组件到状态的完整映射。

适用范围：
- Web 端 MVP（优先）
- 微信小程序 MVP（协同）

输出内容：
- 页面清单（按优先级）
- 页面结构与路由建议
- 组件拆解（原子到业务组件）
- 页面-组件-状态矩阵
- 接口与数据字段建议（UI 所需）
- 开发排期建议与验收标准

---

## 2. 页面清单（MVP）

## 2.1 Web 页面

| 页面ID | 页面名 | 路由建议 | 优先级 | 说明 |
|-------|--------|----------|--------|------|
| `W-001` | 首页 | `/` | P0 | 价值传达 + 工具入口 |
| `W-002` | 工具列表页 | `/tools` | P0 | 工具聚合导航 |
| `W-003` | PDF合并页 | `/tools/merge` | P0 | MVP 核心 |
| `W-004` | 通用任务结果页 | `/result/:taskId` | P0 | 下载、重试、再处理 |
| `W-005` | 会员与定价页 | `/pricing` | P1 | 升级转化 |
| `W-006` | 历史记录页 | `/history` | P1 | 任务回看（可延后） |

## 2.2 微信小程序页面

| 页面ID | 页面名 | 路由建议 | 优先级 | 说明 |
|-------|--------|----------|--------|------|
| `M-001` | 首页 | `pages/home/index` | P0 | 功能宫格 + 最近使用 |
| `M-002` | 合并任务页 | `pages/merge/index` | P0 | 选择来源 + 上传 + 合并 |
| `M-003` | 结果页 | `pages/result/index` | P0 | 下载与分享 |
| `M-004` | 会员页 | `pages/pricing/index` | P1 | 权益说明 |

---

## 3. 页面结构（Web）

## 3.1 `W-001` 首页

模块结构：
1. 顶部导航
2. Hero（主 CTA）
3. 热门工具网格
4. 信任背书
5. FAQ
6. 小程序引流区
7. 页脚

关键交互：
- 点击主 CTA 进入工具页或直接到合并页
- 点击工具卡片进入对应工具工作台

## 3.2 `W-003` PDF合并页（重点）

模块结构：
1. 页面标题与说明
2. 上传拖拽区
3. 文件列表（可排序）
4. 校验与错误提示区
5. 主操作区（开始合并）
6. 处理进度区（处理中显示）

关键交互：
- 多文件上传（点击/拖拽）
- 拖拽排序或上移/下移
- 行内删除、重试上传
- 任务提交与状态轮询

## 3.3 `W-004` 结果页

模块结构：
1. 结果状态头部（成功/失败）
2. 输出文件信息
3. 主次 CTA
4. 建议下一步（再处理/返回工具）

---

## 4. 组件拆解（前端实现级）

## 4.1 原子组件（Atoms）

| 组件ID | 组件名 | Props（建议） | 说明 |
|-------|--------|---------------|------|
| `A-Button` | 按钮 | `variant,size,loading,disabled,onClick` | 主次按钮统一 |
| `A-Icon` | 图标 | `name,size,color` | 统一图标映射 |
| `A-Tag` | 标签 | `type,text` | 状态标签 |
| `A-Progress` | 进度条 | `value,status,showText` | 行级/任务级共用 |
| `A-Input` | 输入框 | `value,placeholder,error` | 参数输入 |

## 4.2 组合组件（Molecules）

| 组件ID | 组件名 | Props（建议） | 说明 |
|-------|--------|---------------|------|
| `M-UploadDropzone` | 拖拽上传区 | `accept,multiple,maxSize,onSelect` | 支持拖拽与点击 |
| `M-FileRow` | 文件行 | `file,status,progress,onDelete,onRetry` | 列表单行 |
| `M-ErrorAlert` | 错误提示条 | `title,message,actionText,onAction` | 支持恢复动作 |
| `M-EmptyState` | 空状态块 | `title,desc,ctaText,onCta` | 首次引导 |
| `M-ToolCard` | 工具卡片 | `icon,title,desc,onClick` | 首页工具入口 |

## 4.3 业务组件（Organisms）

| 组件ID | 组件名 | 子组件 | 说明 |
|-------|--------|--------|------|
| `O-MergeFileList` | 合并文件列表 | `M-FileRow` | 含排序与批量状态 |
| `O-MergeActionPanel` | 合并操作面板 | `A-Button,A-Tag` | 主按钮与规则说明 |
| `O-TaskProgressPanel` | 任务进度面板 | `A-Progress,A-Icon` | 上传/合并阶段反馈 |
| `O-ResultSummary` | 结果摘要 | `A-Icon,A-Button` | 下载与再处理动作 |

---

## 5. 页面-组件-状态矩阵（核心）

状态说明：
- `D` 默认
- `H` 悬停
- `F` 焦点
- `DIS` 禁用
- `L` 加载
- `S` 成功
- `E` 失败
- `EMP` 空状态

| 页面ID | 组件ID | 必备状态 | 状态触发条件 | 前端动作 |
|-------|--------|----------|--------------|----------|
| `W-001` | `M-ToolCard` | `D/H/F` | 鼠标或键盘聚焦 | 高亮卡片并可点击跳转 |
| `W-003` | `M-UploadDropzone` | `EMP/D/H/E` | 初始为空、拖入、校验失败 | 显示引导、高亮边框、错误提示 |
| `W-003` | `M-FileRow` | `D/L/S/E` | 上传中/完成/失败 | 更新进度、显示重试或删除 |
| `W-003` | `O-MergeFileList` | `EMP/D` | 文件数=0 或 >0 | 空态提示或列表渲染 |
| `W-003` | `O-MergeActionPanel` | `DIS/D/L` | 未满足提交条件/可提交/提交中 | 按钮禁用、提交、进入轮询 |
| `W-003` | `O-TaskProgressPanel` | `L/S/E` | 任务处理中/成功/失败 | 展示阶段文案与结果 |
| `W-003` | `M-ErrorAlert` | `E` | 行级或任务级错误 | 给出恢复动作 |
| `W-004` | `O-ResultSummary` | `S/E` | 任务成功或失败 | 下载或重试路径 |
| `M-002` | `M-UploadDropzone` | `EMP/D/E` | 来源选择后上传 | 移动端简化文案 |
| `M-003` | `O-ResultSummary` | `S/E` | 小程序处理结果 | 下载与分享 |

---

## 6. 关键数据结构（前端 Type 建议）

```ts
type UploadStatus = "waiting" | "uploading" | "ready" | "failed";
type TaskStatus = "idle" | "processing" | "success" | "failed";

interface UploadFileItem {
  id: string;
  name: string;
  size: number;
  type: string;
  progress: number;
  status: UploadStatus;
  errorCode?: string;
  errorMessage?: string;
}

interface MergeTaskViewModel {
  taskId?: string;
  files: UploadFileItem[];
  canSubmit: boolean;
  taskStatus: TaskStatus;
  stageText?: string;
  resultFileName?: string;
  resultFileSize?: number;
  downloadUrl?: string;
}
```

---

## 7. 接口联调最小字段（UI 必需）

## 7.1 上传接口返回
- `fileId`
- `fileName`
- `fileSize`
- `status`
- `errorCode`（失败时）
- `errorMessage`（失败时）

## 7.2 合并任务创建接口返回
- `taskId`
- `status`
- `queuedAt`

## 7.3 任务查询接口返回
- `taskId`
- `status`（`processing/success/failed`）
- `progress`（0-100，可选）
- `stageText`（可选）
- `errorCode`/`errorMessage`（失败时）
- `downloadUrl`（成功时）
- `resultFileName`
- `resultFileSize`

---

## 8. 开发拆分建议（两周冲刺样例）

## 8.1 Sprint 1（基础框架）
- 页面框架：`W-001/W-003/W-004`
- 原子/组合组件：`A-*`、`M-UploadDropzone`、`M-FileRow`
- 文件列表与本地状态管理
- 上传流程联调（含行级进度）

## 8.2 Sprint 2（闭环与稳定性）
- 任务提交与轮询
- 结果页与下载闭环
- 错误码映射与恢复动作
- 可访问性与响应式收尾

---

## 9. 验收标准（研发可执行）

- [ ] `W-003` 满足“至少 2 个就绪文件才能提交”
- [ ] 排序结果与最终合并顺序一致
- [ ] 上传、处理中、成功、失败状态可见且可切换
- [ ] 每类失败至少有一种可执行恢复动作
- [ ] 结果页可下载且支持“再处理一组”
- [ ] 375/768/1024/1440 断点无明显布局破坏

---

## 10. 与现有文档映射关系

- 视觉与规范：`UI设计规范-PDF工具集.md`
- 交互流与状态机：`交互设计说明-PDF合并MVP.md`
- 色彩 tokens：`配色方案-PDF工具集.md`
- 图标体系：`图标资源库-PDF工具集.md`

本文件定位为“研发开工蓝图”，优先保证可实现性与联调效率。

