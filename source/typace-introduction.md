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

2.进入部署界面后命名项目，点击部署，如下
![vercel dp1](https://ik.imagekit.io/terryzhang/IMG_6398.jpeg?updatedAt=1746152839523)
接着vercel就开始自动为你部署项目，等待1-2分钟左右就可以看到项目部署完成了。vercel会给你一个congratulations的界面，点击`go to dashbord`去往控制台

3.当看到如下界面时则部署成功，你可以看到博客的预览界面
![vercel dp2](https://ik.imagekit.io/terryzhang/IMG_6399.jpeg)
那么这个时候vercel会给你一个`xxx.vercel.app`的域名，你可以点击页面右上角的`visit`访问，但是vercel在中国大陆被墙了！！！所以vercel二级域无法访问

解决办法是绑定一个自己的域名，有域名的读者可以继续往下看vercel的教程，没有域名的话只能开vpn或者换成natlify或github pages部署，两者的教程尚未完成，这里向诸位抱歉

4.绑定自定义域名 

如果你有自己的域名，请按照下图操作
![vercel dp3](https://ik.imagekit.io/terryzhang/IMG_6400.jpeg?updatedAt=1746161243761)

添加域名后，如果你是一级域名，vercel会建议你将原域名重定向到www开头，这样速度较快，下面用我原来的域名做个范例
![vercel dp4](https://ik.imagekit.io/terryzhang/IMG_6407.jpeg?updatedAt=1746235901184)
按照上图，首先vercel会自动增加一个www开头的域名，将你现在的域名301重定向到www域名，并且在你的域名服务商那里增加两条dns，分别为主域名记录和子域名记录，按图操作
![vercel dp4](https://ik.imagekit.io/terryzhang/IMG_6409.jpeg?updatedAt=1746236566827)
如果使用子域名，则上述步骤在vercel仅需添加域名，服务商增加子域名记录就可

现在你可以打开域名看看了

# P2 index.js配置
以下开始是一些个性化配置，现在需要回到github进入clone本项目的仓库，进入`pages/` `index.js`开始配置
## 2.1网站标题基本配置
在index.js中找到如下代码（大约在957行）

```
      {/* 页面内容 */}
      <div className={`min-h-screen p-8 pt-24 relative z-10 page-container ${
        isMounted ? 'mounted' : ''
      }`}>
        <Head>
          <title>首页 - Typace</title>
        </Head>

        <header className="text-center mb-8">
          <h1 className="text-6xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-blue-600 dark:from-blue-500 dark:to-blue-700">
            Typace
          </h1>
          <div className="hitokoto-container">
            <p className="mt-4 text-lg text-gray-600 dark:text-gray-400 italic">
              <span className="typewriter">{displayText}</span>
            </p>
          </div>
        </header>
```
将其中的`Typace`和`首页-Typace`更改为你自己的网站标题，分别对应网站大标题和标签页首页标题，效果如下
![index](https://ik.imagekit.io/terryzhang/IMG_6410.jpeg?updatedAt=1746238192300)
![index](https://ik.imagekit.io/terryzhang/IMG_6411.jpeg?updatedAt=1746238192041)

找到如下代码，对应导航栏标题，大约在第800行
```
      {/* 导航栏 */}
      <nav className="fixed top-0 left-0 w-full bg-white/80 dark:bg-gray-800/80 backdrop-blur-md shadow-md z-50">
        <div className="container mx-auto px-8 py-4">
          <div className="flex justify-between items-center">
            <Link href="/" passHref>
              <a className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-blue-600 dark:from-blue-500 dark:to-blue-700">
                Typace
              </a>
            </Link>

```
将其中的Typace改为你的标题，效果如下
![index](https://ik.imagekit.io/terryzhang/IMG_6412.jpeg)
以上两段代码均可改字体颜色，分别位于“typace”的上方一行代码，若需更改字体颜色可按照js语法进行更改，例：
```
 <a className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-red-400 to-red-600 dark:from-red-500 dark:to-red-700">
```
此处对应的则是红色渐变色，其他颜色将原代码里的blue改为其他颜色即可


