var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var port = process.env.PORT || 3000;
var path =  require('path');

var cookieParser = require('cookie-parser');
app.use(cookieParser());

var session = require('express-session');
app.use(session({
    secret: "secret password"
}));

var curUsers = {};
var history = [];
var users = [];
var newName;

//This function is used to update the names associated with each message once
//a name is changed
var updateHistory = function(oldNick, nickNew) {
    for(key in history) {
        if(history[key].user === oldNick){
            history[key].user = nickNew;
        }
    }

    for(let i = 0 ; i < users.length ; i++) {
        if (users[i] === oldNick){
            useres[i] = nickNew;
        }
    }
}

//This function checks to see if the color requested is valid
var checkColor = function(color) {
    //check if the string is 6 digits long
    let response = 0;
    if (color.length === 6) {
        //check each element of the string to see if its in the right range
        var split = color.split('');
        for (let i = 0; i < split.length; i++) {
            var char = split[i].toUpperCase();
            if ((char >= '0' && char <= '9') || (char >= 'A' && char <= 'F')) {
                response++;
            }
        }
    } else {
        response = 0;
    }
    return response;
}

//This function generates a random color for each new connection
var colorGen = function() {
    //TAKEN FROM https://stackoverflow.com/questions/1484506/random-color-generator
    //generate a random 6 letter color
    var possibleVals = '0123456789ABCDEF';
    var color = '#';
    for (let i = 0; i < 6; i++) {
        color += possibleVals[Math.floor(Math.random() * 16)];
    }
    return color;
}

//This function checks to see if the requested username already exists or not
var nameInUsers = function(name) {
    let num = 0;
    for (key in curUsers) {
        if (curUsers[key].name.toLowerCase() === name.toLowerCase()) {
            num++;
        }
    }
    if (num === 1) {
        return 0;
    } else {
        return 1;
    }
}

//This function generates a new for each new connection
var nameGenerate = function(user) {
    let name = 'User' + Math.floor(Math.random() * 999);
    color = colorGen();
    curUsers[user] = {
      name: name,
      color: color
  }

  return name;

}

//This function is used to find the socket associated with each name
var findKey = function(value) {
    for(key in curUsers) {
        if(curUsers[key].name === value){
            return key;
        }
    }
}

app.use(express.static(path.join(__dirname, "public")));

app.get('/', function(req, res) {
    res.sendFile(__dirname + '/public/index.html');
});

app.get('/test', function(req, res) {
    //check if there is a cookie
    if(req.session.name){
        //send back name associated with cookie
        let existingName = req.session.name;
        res.send(existingName);
        //if not in users, add
        if(users.indexOf(existingName) === -1){
            users.push(existingName);
        }
    } else {
        //create a cookie
        let randomSocket = Math.floor(Math.random() * 999);
        newName = nameGenerate(randomSocket);
        users.push(newName);
        req.session.name = newName;
        res.send(newName);

    }
});

app.get('/cookieUpdate/:name', function(req,res) {
    //update the socket associated with the cookie
    let na = req.params.name;
    req.session.name = na;
    res.send('cookie updated');
});


io.on('connection', function(socket) {

    //this function is used to send chat messages across multiple connections
    socket.on('chat message', function(msg) {
        let dt = new Date();
        let hour = dt.getHours();
        let minutes = (dt.getMinutes() < 10 ? '0' : '') + dt.getMinutes();
        let seconds = (dt.getSeconds() < 10 ? '0' : '') + dt.getSeconds();
        var date = hour + ":" + minutes + ":" + seconds;
        let color = curUsers[socket.id].color

        //add to chat history
        history.push({
            color: color,
            time: date,
            message: msg,
            user: curUsers[socket.id].name
        });
        //send to everyone connected
        let returnMsg = {
            color: color,
            time: date,
            message: msg,
            user: curUsers[socket.id].name
        };
        io.emit('chat message', returnMsg);
    });

    socket.on('assign socket', function(msg){
        //update socket information
        var nameOfUser = msg;
        let socketID = socket.id;
        //find the key associated with the name
        var keyOld = findKey(nameOfUser);
        curUsers[socketID] = curUsers[keyOld];
        delete curUsers[keyOld];
        let returnMesg = {
            name: nameOfUser,
            history: history
        }
        socket.emit('new name', returnMesg);
        io.emit('users', users);

    });
    //This function returns a new random for each new connection
    // socket.on('get name', function(msg) {
    //     let socketName = socket.id;
    //     let name = nameGenerate(socketName);
    //     let returnMesg = {
    //         name: name,
    //         history: history
    //     };
    //
    //     socket.emit('new name', returnMesg);
    //     io.emit('users', users);
    // });

    //This is used to update the color for the user
    socket.on('nick color change', function(msg) {
        let socketName = socket.id;
        let colorNew = msg.replace('/nickcolor ', '');
        let returnMesg
        //check if the color is legit
        if (checkColor(colorNew) === 6) {
            curUsers[socketName].color = '#' + colorNew;
            returnMesg = " >>> Color has been successfully changed to " + colorNew;
        } else {
            returnMesg = " >>>> Color was not changed because " + colorNew + " is not a real color";
        }

        socket.emit('color change response', returnMesg);
    });

    //This function is used to change the nick of a connection
    socket.on('nick change', function(msg) {
        let socketName = socket.id;
        let oldNick = curUsers[socketName].name;
        let nickNew = msg.replace('/nick ', '');
        let returnMesg;
        //check if the name is legit
        if (nameInUsers(nickNew) === 1) {
            curUsers[socketName].name = nickNew;
            returnMesg = {
                msg: ">>> Name has been changed to " + nickNew,
                name: nickNew
            };
            //update history
            updateHistory(oldNick, nickNew);
        } else {
            returnMesg = {
                msg: ">>> Name has not been changed. Name " + nickNew + " already exists.",
                name: oldNick
            };
        }

        socket.emit('name response', returnMesg);
        //update the list of users
        io.emit('users', users);
    });

    //This function is used if a user disconnects
    socket.on('disconnect', function(data) {
      console.log('Got disconnect!');
      var socketID = socket.id;
      var nameOfSocket = curUsers[socketID].name;
      var i = users.indexOf(nameOfSocket);
      users.splice(i, 1);
      io.emit('users', users);
   });

});

http.listen(port, function() {
    console.log('listening on *:' + port);
});
