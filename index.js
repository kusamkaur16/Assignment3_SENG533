var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var port = process.env.PORT || 3000;

var curUsers = {};
var history = "";

var nameInUsers = function(name) {
    let num = 0;
    for (key in curUsers){
        if(curUsers[key] === name){
            num++;
        }
    }
    if(num > 0){
        return 0;
    } else {
        return 1;
    }
}
var nameGenerate = function(user){
    let name = 'User' + Math.floor(Math.random() * 999);
    curUsers[user] = name;

    return name;

}

app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');

  //assign name to user
});

io.on('connection', function(socket){

  socket.on('chat message', function(msg){
      var dt = new Date();
      var date = dt.getHours() + ":" + (dt.getMinutes()) + ":" + (dt.getSeconds());
     let message = date + " " + curUsers[socket.id] + ": " + msg;
     history += "<li>" + message + "</li>";
     let returnMsg = {
         message: message,
         user : curUsers[socket.id]
     };
    io.emit('chat message', returnMsg);
  });

  socket.on('get name', function(msg){
    let socketName = socket.id;
    let name = nameGenerate(socketName);
    let returnMesg = {
        name: name,
        history: history
    };

    socket.emit('new name', returnMesg);
    io.emit('users', Object.values(curUsers))
  });
});

http.listen(port, function(){
  console.log('listening on *:' + port);
});
