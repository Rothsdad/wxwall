var appID = require("./config").appID;
var appSecret = require("./config").appSecret;

var getToken = require("./token").getToken;

var request = require("request");

function getUserInfo(openID){
    return getToken(appID, appSecret).then(function(res){
        var token = res.access_token;

        return new Promise(function(resolve, reject){
            request("https://api.weixin.qq.com/cgi-bin/user/info?access_token="+token+"&openid="+openID+"&lang=zh_CN", function(err, res, data){
                console.log("data:"+data);
                resolve(JSON.parse(data));
            });
        });
    }).catch(function(err){
        console.log(err);
    });
}

module.exports = {
    getUserInfo: getUserInfo
};
