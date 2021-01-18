# 周深QQ音乐音源数据

这是一个基于 Express + Axios 的 Nodejs 项目，用来记录周深的QQ音乐音源成绩。数据非实时，每日更新两次。

[App 直达](https://zhou-shen-music-data.herokuapp.com)

灵感来源:
- [Binaryify/NeteaseCloudMusicApi](https://github.com/Binaryify/NeteaseCloudMusicApi)
- [itisbean/php-qq-music-api](https://github.com/itisbean/php-qq-music-api)
## Start

```shell
$ git clone git@github.com:bonbon-et-chocolat/QQMusicApi.git

$ npm install

$ npm start
```

项目默认端口为 3300，如果需要启用数据统计、ip拦截等，可以将 `bin/config.js` 中的 `useDataStatistics` 设为 `true` （会存在直接拦截部分来自其他后台的请求）
## 更新记录
21-01-18：🐟 优化UI
21-01-17：🐱 收藏量排行榜

### 收藏量Top100排行榜

链接：[/hitsongs](https://zhou-shen-music-data.herokuapp.com/zhoushen/hitsongs)

内容：本链接记录周深当日QQ音乐粉丝总数，过去24小时收听总人数。收录收藏数量排行前100位的歌曲的发行日期，总收听量（过去一周？不确定。），过去24小时的巅峰指数喝收听人数。
