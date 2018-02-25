var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var port = process.env.PORT || 3000;

var curUsers = {};
var history = "";

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

var nameInUsers = function(name) {
    let num = 0;
    for (key in curUsers) {
        if (curUsers[key].name === name) {
            num++;
        }
    }
    if (num === 1) {
        return 0;
    } else {
        return 1;
    }
}
var nameGenerate = function(user) {
    let name = 'User' + Math.floor(Math.random() * 999);
    color = colorGen();
    curUsers[user] = {
        name: name,
        color: color
    }

    return name;

}

app.get('/', function(req, res) {
    res.sendFile(__dirname + '/index.html');

    //assign name to user
});

io.on('connection', function(socket) {

    socket.on('chat message', function(msg) {
        var dt = new Date();
        var date = dt.getHours() + ":" + (dt.getMinutes()) + ":" + (dt.getSeconds());
        let message = "<li><font color=" + curUsers[socket.id].color + ">" + date + " " +
            curUsers[socket.id].name + ": " + msg + "</font></li>";
        history += message;
        let returnMsg = {
            message: message,
            user: curUsers[socket.id].name
        };
        io.emit('chat message', returnMsg);
    });

    socket.on('get name', function(msg) {
        let socketName = socket.id;
        let name = nameGenerate(socketName);
        let returnMesg = {
            name: name,
            history: history
        };

        socket.emit('new name', returnMesg);
        io.emit('users', Object.values(curUsers))
    });

    socket.on('nick color change', function(msg) {
        let socketName = socket.id;
        let colorNew = msg.replace('/nickcolor ', '');
        let returnMesg
        //check if the color is legit
        if (checkColor(colorNew) === 6) {
            curUsers[socketName].color = '#' + colorNew;
            returnMesg = "Color has been successfully changed to " + colorNew;
        } else {
            returnMesg = "Color was not changed because " + colorNew + " is not a real color";
        }

        socket.emit('color change response', returnMesg);
    });

    socket.on('nick change', function(msg) {
        let socketName = socket.id;
        let oldNick = curUsers[socketName].name;
        let nickNew = msg.replace('/nick ', '');
        let returnMesg;
        //check if the name is legit
        if (nameInUsers(nickNew) === 1) {
            curUsers[socketName].name = nickNew;
            returnMesg = {
                msg: "Name has been changed to " + nickNew,
                name: nickNew
            };
        } else {
            returnMesg = {
                msg: "Name has not been changed. Name " + nickNew + " already exists.",
                name: oldNick
            };
        }

        socket.emit('name response', returnMesg);
        //update the list of users
        io.emit('users', Object.values(curUsers))
    });
});

http.listen(port, function() {
    console.log('listening on *:' + port);
});
