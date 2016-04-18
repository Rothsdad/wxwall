var PORT=9901;
var http = require('http');
var qs = require('qs');

var TOKEN = 'unix';

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

    console.log(params);
    console.log("token-->",TOKEN);

    if(checkSignature(params,TOKEN)){
        console.log("success");
        response.end(params.echostr);
    }else{
        console.log("failed");
        response.end('signature failed');
    }
});

server.listen(PORT);

console.log("Server running at port "+PORT+".")
