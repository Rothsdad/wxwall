var express =require('express');
var path = require('path');

//创建express实例
var app = express();
//定义EJS模板引擎和模板文件位置
app.set('views',path.join(__dirname,'views'));
app.set('view engine','ejs');

//定义静态文件目录
app.use(express.static(path.join(__dirname,'public')));
//相应首页get请求
app.get('/',function(req,res){
        return res.render('index');
});

//监听3000端口
app.listen(80,function(req,res){
    console.log('WeChat wall is running at port 80');
});
