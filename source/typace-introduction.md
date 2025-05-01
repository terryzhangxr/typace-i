---
title: 'Typace主题开源配置教程（中文）' 
date: '2025-2-21'
cover: https://ik.imagekit.io/terryzhang/%E5%B1%8F%E5%B9%95%E6%88%AA%E5%9B%BE%202025-04-17%20204625.png
tags: ["教程"]["公告"]
---

注：本文为typace主题的中文教程，按照typace最新版本（不含测试版）进行编写，英文版请见github仓库

# P0 项目框架结构
Project Structure

pages/: 包含网站主要页面及功能
  _app.js: 导入全局 CSS 样式并设置主应用包装器
  _document.js: 在 HTML 文档中添加 favicon 并设置页面标题
  about.js: 从 about.md 获取并展示关于页面内容，具备搜索和暗黑模式功能
  api/sitemap.js: 为网站生成 XML 格式的站点地图文件
  index.js: 作为网站的首页
  archive.js: 实现归档页面，包含文章列表和搜索功能
  tags.js: 标签页面，按文章标签分类并在主页显示
  posts/: 存放单个博客文章页面
  
source/: 存放博客文章
