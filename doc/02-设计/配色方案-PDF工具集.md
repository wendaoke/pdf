# PDF工具集 配色方案（Web + 微信小程序）

## 1. 设计目标

本配色方案服务于以下目标：
- 强化“上传-处理-下载”主流程的视觉引导
- 保证亮色场景下的可读性与稳定对比度
- 在 Web 与小程序保持品牌一致性

---

## 2. 品牌色与语义色

## 2.1 品牌主色

| Token | 色值 | 用途 |
|------|------|------|
| `brand-primary` | `#0891B2` | Logo 主色、导航高亮、链接 |
| `brand-secondary` | `#22D3EE` | 辅助高亮、标签背景、图表次色 |
| `brand-cta` | `#22C55E` | 主操作按钮（开始处理、下载） |

## 2.2 语义状态色

| Token | 色值 | 用途 |
|------|------|------|
| `state-success` | `#16A34A` | 成功状态、完成提示 |
| `state-warning` | `#F59E0B` | 额度告警、风险提示 |
| `state-error` | `#DC2626` | 错误、失败、异常 |
| `state-info` | `#0284C7` | 信息提示、处理中状态 |

---

## 3. 中性色系统

| Token | 色值 | 用途 |
|------|------|------|
| `bg-page` | `#F8FAFC` | 页面基础背景 |
| `bg-panel` | `#ECFEFF` | 信息分区背景 |
| `bg-card` | `#FFFFFF` | 卡片、弹层底色 |
| `border-default` | `#E2E8F0` | 默认边框 |
| `text-primary` | `#164E63` | 主文字 |
| `text-secondary` | `#475569` | 次级说明 |
| `text-muted` | `#64748B` | 辅助说明/占位 |
| `text-inverse` | `#FFFFFF` | 深色背景上的文字 |

---

## 4. 场景映射

## 4.1 上传与处理流程
- 拖拽上传区默认边框：`border-default`
- 拖拽悬停：边框切换 `brand-primary`，背景 `bg-panel`
- 上传中进度条：`state-info`
- 处理成功：`state-success`
- 处理失败：`state-error`

## 4.2 合并页关键动作
- 主按钮（开始合并/下载）：`brand-cta`
- 次按钮（重试/重新选择）：白底 + `brand-primary` 描边
- 禁用态：按钮背景 `#94A3B8`，文字 `#E2E8F0`

## 4.3 会员与限额提示
- 免费额度剩余：`state-info`
- 接近上限提示：`state-warning`
- 超限提示：`state-error`
- 升级入口：`brand-cta`

---

## 5. 图表与数据颜色（可选）

用于后台运营看板或管理端：

| 数据角色 | 色值 |
|---------|------|
| 转化率 | `#0891B2` |
| 成功率 | `#16A34A` |
| 失败率 | `#DC2626` |
| 等待队列 | `#F59E0B` |
| 活跃用户 | `#22D3EE` |

---

## 6. 交互态颜色

## 6.1 主按钮（`brand-cta`）
- 默认：`#22C55E`
- Hover：`#16A34A`
- Active：`#15803D`
- Disabled：`#94A3B8`

## 6.2 链接/文本按钮（`brand-primary`）
- 默认：`#0891B2`
- Hover：`#0E7490`
- Active：`#155E75`

---

## 7. 可访问性要求

- 主文字与背景对比度不低于 4.5:1
- 重要状态不只依赖颜色，需加图标/文案
- 错误态建议使用：
  - 背景：`#FEF2F2`
  - 边框：`#FCA5A5`
  - 文字：`#B91C1C`

---

## 8. 主题落地建议

## 8.1 CSS 变量（Web）

```css
:root {
  --brand-primary: #0891B2;
  --brand-secondary: #22D3EE;
  --brand-cta: #22C55E;

  --state-success: #16A34A;
  --state-warning: #F59E0B;
  --state-error: #DC2626;
  --state-info: #0284C7;

  --bg-page: #F8FAFC;
  --bg-panel: #ECFEFF;
  --bg-card: #FFFFFF;
  --border-default: #E2E8F0;

  --text-primary: #164E63;
  --text-secondary: #475569;
  --text-muted: #64748B;
  --text-inverse: #FFFFFF;
}
```

## 8.2 小程序 Tokens（建议命名）
- `colorBrandPrimary`
- `colorCta`
- `colorSuccess`
- `colorWarning`
- `colorError`
- `colorTextPrimary`

---

## 9. 验收清单

- [ ] Web 与小程序主色一致
- [ ] 主 CTA 在所有关键页统一为 `brand-cta`
- [ ] 错误与告警状态可快速识别
- [ ] 在浅色背景下正文可读性达标
- [ ] 禁用态与可用态区分明显

