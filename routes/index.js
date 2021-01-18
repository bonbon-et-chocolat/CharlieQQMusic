/* GET home page. */
module.exports = {
  '/': (req, res, next) => {
    res.render('index', {title: '周深QQ音乐数据', content: ''});
  }
}
