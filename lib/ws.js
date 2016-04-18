var WS_PORT=require('./config').wsPort;

var wss = new require('ws').Server({port:WS_PORT});

wss.on("connection",function connection(ws){
    ws.on("message",function incoming(message){
        console.log("receive message from client:%s",message);
    })
});

wss.broadcast = function broadcast(data){
    wss.clients.forEach(function each(client){
        client.send(JSON.stringify(data));
    })
};

module.exports={
    wss:wss
}

console.log("Socket server running at port:"+WS_PORT+".");
