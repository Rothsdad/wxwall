var http = require('http');
var qs = require('qs');
var PORT = require('./lib/config').wxPort;
var getUserInfo = require('./lib/user').getUserInfo;
var wss = require('./lib/ws.js').wss;
var TOKEN = require('./lib/config').token;
//var fs = require('fs');
//var request= require('request');

function checkSignature(params,token){
    //1.将token，timestamp,nonce三个参数进行字典排序
    //2.将三个参数字符串凭借成一个字符串进行sha1加密
    //3.开发者获得加密后的字符串可与signature对比，标识该请求来源于微信
    var key = [token, params.timestamp,params.nonce].sort().join('');
    var sha1 = require('crypto').createHash('sha1');
    sha1.update(key);
    var signature=sha1.digest('hex');
    return signature == params.signature;
}

var server = http.createServer(function(request,response){
    //解析URL中的query部分，用qs模板将query解析成json
    var query = require('url').parse(request.url).query;
    var params = qs.parse(query);
    if(!checkSignature(params,TOKEN)){
        response.end('signature failed');
        return;
    }
    if(request.method=='GET'){
        //如果请求是GET,返回echostr用于通过服务器的有效校验
        response.end(params.echostr);
    }else{
        //否则是微信给开发者服务器的POST请求
        var postdata = "";
        request.addListener("data",function(postchunk){
            postdata+=postchunk;
        });
        //获取到了POST数据
        request.addListener("end",function(){
            var parseString = require('xml2js').parseString;
            parseString(postdata,function(err,result){
                var xml=result.xml;
                console.log("Receiving data:")
                console.log(result);
                responseXml=getResponseXml(xml);
                response.end(responseXml);
                getUserInfo(result.xml.FromUserName[0])
                    .then(function(userInfo){
                        //获得用户信息，合并到消息中
                        result.user = userInfo;
                        console.log("UserInfo:")
                        console.log(userInfo);
                        //if(result.xml.MsgType[0]=="image"){
                        //    var imgsrc=result.xml.PicUrl[0];
                        //    console.log("picUrl:"+imgsrc);
                        //    filename=result.xml.MediaId[0]+".jpg";
                        //    console.log("filename:"+filename);
                        //    downloadImg(imgsrc,filename,function(){
                        //        result.xml.PicUrl="/tmp_img/"+filename;
                        //        wss.broadcast(result);
                        //    })
                        //}else{
                            //将消息通过websocket广播
                            wss.broadcast(result);
                        //}
                        });
            });
        });
    }
});

function getResponseXml(xml) {
    var msgType=xml.MsgType[0];
    var to_username = xml.ToUserName[0];
    var from_username = xml.FromUserName[0];
    var responseXml = {xml: {}}
    responseXml.xml.ToUserName = from_username;
    responseXml.xml.FromUserName = to_username;
    if (msgType === "event") {
        var event = xml.Event[0];
        if (event = "subscribe") {
            responseXml.xml.CreateTime = new Date().getTime();
            responseXml.xml.MsgType = "text";
            responseXml.xml.Content = "欢迎加盟小锤微信墙";
        }
    } else if (msgType === "text") {
        responseXml.xml.CreateTime = new Date().getTime();
        responseXml.xml.MsgType = msgType;
        responseXml.xml.Content = xml.Content[0];
    } else if (msgType === "image") {
        responseXml.xml.CreateTime = new Date().getTime();
        responseXml.xml.MsgType = msgType;
        responseXml.xml.Image={};
        //responseXml['xml']['Image']['MediaId'] = "5x2MiRQzcZockzXjFQRhzjl5fuybBtiyqxBYv2zraUG7TdyA3Wl1wHsI7uqxUs88";
        responseXml.xml.Image.MediaId = xml.MediaId[0];
    }else if(msgType === "voice"){
        responseXml.xml.CreateTime = new Date().getTime();
        responseXml.xml.MsgType = msgType;
        responseXml.xml.Voice={};
        //responseXml['xml']['Voice']['MediaId'] = "2u9cYIkNBNSO-lElNpahD89SlMgQxZhYoBAotL-Fa9DJdpVW3Y_3WZPZLV85ls2a";
        responseXml.xml.Voice.MediaId = xml.MediaId[0];
    }else if(msgType==="video"||msgType==="shortvideo"){
        responseXml.xml.CreateTime=new Date().getTime();
        responseXml.xml.MsgType="video";
        responseXml.xml.Video={};
        //responseXml['xml']['Video']['MediaId']="kQtKyQoLWZouHxIs6LFpbRB24SBbccCsM3CqTDQHfS28p1wSC9wSz2yp-3Asyylq";
        responseXml.xml.Video.MediaId=xml.MediaId[0];
    }else{
        responseXml.xml.CreateTime = new Date().getTime();
        responseXml.xml.MsgType = "text";
        responseXml.xml.Content = "已收到您的信息！";
    }
    console.log(responseXml);
    var xml2js = require('xml2js');
    var builder = new xml2js.Builder();
    return builder.buildObject(responseXml);
}

//var downloadImg = function(uri, filename, callback){
//    request.head(uri, function(err, res, body){
//        if (err) {
//            console.log('err: '+ err);
//            return false;
//        }
//        console.log('res: '+ res);
//        request(uri).pipe(fs.createWriteStream('public/tmp_img/'+filename)).on('close', callback);  //调用request的管道来下载到 images文件夹下
//    });
//};

server.listen(PORT);

console.log("Server running at port "+PORT+".")
