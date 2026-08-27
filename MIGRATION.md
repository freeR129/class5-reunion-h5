# 高2013级5班十周年聚会 H5｜迁移说明

## 新电脑继续制作

1. 解压整个文件夹。
2. 安装 Node.js 22.13 或更高版本。
3. 在项目目录运行 `npm install`。
4. 运行 `npm run dev`，浏览器打开终端显示的本地网址。
5. 修改 `app/page.tsx` 可调整内容、时间轴数据和交互；修改 `app/theme.css` 可调整蓝色星河主题。
6. 正式检查使用 `npm run build`。

## 主要文件

- `app/page.tsx`：四屏 H5、手势、时间轴数据与投票逻辑。
- `app/globals.css`：基础布局与动画。
- `app/theme.css`：参考图风格的蓝色星河主题。
- `public/`：分享图、星空背景及后续视频/照片放置目录。
- `reference-materials/`：用户提供的四张原始设计参考图。
- `.openai/hosting.json`：现有 Sites 项目标识；请勿随意修改 `project_id`。

## 视频与照片

- 视频文件放到 `public/reunion.mp4`。
- 时间轴照片建议放在 `public/assets/images/<年份>/`。
- 然后在 `app/page.tsx` 的 `timelineData` 中填入以 `/assets/...` 开头的图片路径。

## 投票数据说明

当前版本尚未接入 Supabase。投票选择保存在每台设备浏览器的 `localStorage` 中，页面显示的人数为 Mock 数值，因此没有服务器数据库可随项目压缩包迁移。接入 Supabase 后，应单独导出数据库表和环境变量；不要把密钥写入源码或压缩包。

## 部署

现有线上地址为：`https://class-five-reunion-2026.ruifu955.chatgpt.site`

在新电脑的 Codex 中打开项目后，可继续使用 Sites 保存和发布新版本。若无法访问原 Sites 项目，请保留源码并新建一个站点部署。
