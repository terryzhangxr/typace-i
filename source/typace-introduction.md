---
title: 'Typace主题开源配置教程（中文）' 
date: '2025-2-21'
cover: https://ik.imagekit.io/terryzhang/%E5%B1%8F%E5%B9%95%E6%88%AA%E5%9B%BE%202025-04-17%20204625.png
tags: ["教程"]
sticky: 999
---

注：本文为typace主题的中文教程，按照typace最新版本（不含测试版）进行编写，英文版请见github仓库

# P0 项目框架结构
- `pages/`: 包含网站主要页面
  - `about.js`:   从 `about.md`获取并展示关于页面内容
  - `index.js`:   博客首页，包含博客基本信息
  - `posts/`:   单页面文章存储
  - `archives.js`:   按时间顺序归档文章
  - `tags.js`:   按md表头标签分类文章
  - `_document.js`:   网页标签栏信息
  - `api/`:   存放api文件
    - `sitemap.js`:   sitemap
- `source/`:   文章存放页
- `lib/posts.js`:   包含从`source/`目录获取和排序博客文章数据的函数
- `styles/globals.css`:   Global CSS 全局样式配置
- `tailwind.config.js`:   tailwind css样式引用


# P1 项目基本配置部署
本博客支持github在线编辑开发，建议使用直接通过vercel在线安装部署，本地安装也可

项目当前版本 v2.0.1
## 1.1在线安装
1.本项目基于github作为托管平台，使用vercel部署，直接点击下方按钮即可自动clone仓库并在vercel进行部署
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fterryzhangxr%2Ftypace-i)
> [注意]
> 若未注册vercel账号，请在登陆注册界面使用github绑定快捷登录方便后续github自动抓取本仓库到您的账号下
                




