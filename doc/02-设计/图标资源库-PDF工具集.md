# PDF工具集 图标资源库与使用规范

## 1. 目标

建立统一图标标准，保证：
- 功能识别一致
- Web 与小程序视觉统一
- 可维护、可扩展

推荐图标集：`Lucide`（线性风格）或 `Heroicons`（统一轮廓）。

---

## 2. 全局规范

## 2.1 基础规格
- 画板：`24x24`
- 线宽：`1.75` 或 `2`（全局固定一个）
- 圆角：跟随图标库默认，不混用多风格
- 默认尺寸：
  - 导航：20px
  - 卡片标题：20px
  - 按钮内：16px
  - 状态提示：16px

## 2.2 颜色规则
- 默认：`text-primary`（`#164E63`）
- 激活：`brand-primary`
- 成功/警告/错误状态图标使用语义色
- 禁止彩色渐变图标混入功能区

## 2.3 交互规则
- 可点击图标必须配合 `cursor-pointer`（Web）
- 必须有 hover/focus 反馈（颜色或背景变化）
- 图标按钮最小点击区 `40x40`

---

## 3. 功能图标映射

## 3.1 核心工具

| 功能 | 推荐图标名（Lucide） | 说明 |
|------|----------------------|------|
| PDF转Word | `FileText` | 文档转换类入口 |
| PDF转Excel | `Table2` | 表格数据处理 |
| PDF转PPT | `Presentation` | 演示文档 |
| Word转PDF | `FileType` | 反向转换 |
| Excel转PDF | `Sheet` | 表格转 PDF |
| PPT转PDF | `MonitorPlay` | 演示文稿转 PDF |
| PDF合并 | `Files` | 多文件合并 |
| PDF拆分 | `Scissors` | 拆分类动作 |
| PDF压缩 | `Minimize2` | 压缩优化 |
| OCR识别 | `ScanText` | 识别提取 |

## 3.2 任务与状态

| 状态 | 推荐图标 | 颜色 |
|------|----------|------|
| 等待中 | `Clock3` | 中性色 |
| 上传中 | `Upload` | `state-info` |
| 处理中 | `LoaderCircle` | `state-info` |
| 已完成 | `CheckCircle2` | `state-success` |
| 失败 | `XCircle` | `state-error` |
| 重试 | `RefreshCw` | `brand-primary` |

## 3.3 通用操作

| 行为 | 推荐图标 |
|------|----------|
| 上传文件 | `UploadCloud` |
| 下载结果 | `Download` |
| 删除文件 | `Trash2` |
| 拖拽排序 | `GripVertical` |
| 查看详情 | `Eye` |
| 设置选项 | `Settings2` |
| 分享结果 | `Share2` |

---

## 4. 页面级图标配置

## 4.1 Web 首页
- Hero 主图标：`FileStack`
- 工具网格：每个工具一个功能图标
- 优势区：速度 `Zap`、安全 `ShieldCheck`、质量 `BadgeCheck`

## 4.2 PDF合并页
- 上传区：`UploadCloud`
- 列表行：`FileText`
- 排序手柄：`GripVertical`
- 删除：`Trash2`
- 状态：按任务状态图标映射

## 4.3 小程序首页
- 宫格图标保持与 Web 一致语义
- 尺寸建议 24px，标签文字 12-14px
- 最近使用与状态图标优先轻量线性风格

---

## 5. 可访问性规范

- 图标按钮必须有可读标签（`aria-label` 或文本）
- 非纯装饰图标不得省略可访问描述
- 图标与背景对比清晰，不低于可读阈值

---

## 6. 命名与目录建议

文件命名：
- `ic_tool_merge.svg`
- `ic_status_success.svg`
- `ic_action_download.svg`

分类建议：
- `tool/`（功能）
- `status/`（状态）
- `action/`（行为）
- `brand/`（品牌/生态图标）

---

## 7. 不可使用清单

- 不使用 emoji 作为功能图标
- 不混用实心与线性风格造成视觉跳变
- 不使用来源不明品牌图标
- 不在同一页面混用 16/20/24 多个随机尺寸

---

## 8. 验收清单

- [ ] 全部核心功能已映射统一图标
- [ ] 状态图标与状态色一致
- [ ] 可点击图标具备 hover/focus 反馈
- [ ] 图标按钮可通过键盘访问
- [ ] Web 与小程序语义一致

