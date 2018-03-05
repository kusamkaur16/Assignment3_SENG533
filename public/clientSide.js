$(function() {
    var socket = io();
    var name;

    //display all active users
    var listUsers = function(arr) {
        let append = "";

        for (let i = 0; i < arr.length; i++) {
            append += "<li>" + arr[i] + "</li>";
        }
        return append;
    };

    $(document).ready(function() {
        var xhttp = new XMLHttpRequest();
        xhttp.onreadystatechange = function() {
            if (this.readyState == 4 && this.status == 200) {
                var msg = this.responseText;
                socket.emit('assign socket', msg);
            }
        };
        xhttp.open("GET", "/test", true);
        xhttp.send();
    });

    $('form').submit(function() {
        //check if changing nick name
        //check if changing the color of nick
        let contents = $('#writeHere').val();

        if (contents.includes('/nickcolor')) {
            socket.emit('nick color change', contents);
        } else if (contents.includes('/nick')) {
            socket.emit('nick change', contents);
        } else {
            socket.emit('chat message', contents);
        }
        $('#writeHere').val('');
        return false;
    });

    socket.on('chat message', function(msg) {
        //if the message was sent by you, use a different chat bubble
        if (msg.user == name) {
            console.log(msg.color);
            let bubble = "<div class='speech-bubbleMine'><div class = 'dialog'><p  style='color: " + msg.color + ";'>" + msg.message + "</p></div>" +
                "<div class ='time'>" + msg.time + "</div>" + "<div class = 'user'>" + msg.user + "</div>" + "</div>";
            let message = msg.message.replace('<li>', '<li class="bold">');
            $('#incomingMessages').append(bubble);
        } else {
            let bubble = "<div class='speech-bubble'><div class = 'dialog'><p  style='color: " + msg.color + ";'>" + msg.message + "</p></div>" +
                "<div class ='time'>" + msg.time + "</div>" + "<div class = 'user'>" + msg.user + "</div>" + "</div>";
            $('#incomingMessages').append(bubble);
        }
        let div = $('#incomingMessages');
        div.scrollTop(div.get(0).scrollHeight);
    });

    socket.on('new name', function(msg) {
        name = msg.name;
        $('#name').append(name);
        //get the incomingMessages
        let retrievedMessages = "";

        //display all messages in history
        for (var i = 0; i < msg.history.length; i++) {
            if (msg.history[i].user === name) {
                retrievedMessages += "<div class='speech-bubbleMine'><div class = 'dialog'><p  style='color: " + msg.history[i].color + ";'>" + msg.history[i].message + "</p></div>" +
                    "<div class ='time'>" + msg.history[i].time + "</div>" + "<div class = 'user'>" + msg.history[i].user + "</div>" + "</div>";
            } else {
                retrievedMessages += "<div class='speech-bubble'><div class = 'dialog'><p  style='color: " + msg.history[i].color + ";'>" + msg.history[i].message + "</p></div>" +
                    "<div class ='time'>" + msg.history[i].time + "</div>" + "<div class = 'user'>" + msg.history[i].user + "</div>" + "</div>";
            }
        }
        $('#incomingMessages').append(retrievedMessages);
    });

    socket.on('users', function(msg) {
        //list all active users
        $('#users').empty();
        $('#users').append(listUsers(msg));
    });

    socket.on('color change response', function(msg) {
        $('#incomingMessages').append('<li>' + msg + '</li>');
    });

    socket.on('name response', function(msg) {
        name = msg.name;
        $('#name').text('Welcome ' + name);
        $('#incomingMessages').append('<li>' + msg.msg + '</li>');
        //if name change successful, update cookie
        if (!msg.msg.includes('not')) {
            //update cookie
            console.log('in here check');
            let request = "/cookieUpdate/" + name;
            var xhttp2 = new XMLHttpRequest();
            xhttp2.onreadystatechange = function() {
                console.log('cookie updated!');
            };
            xhttp2.open("GET", request, true);
            xhttp2.send();
        }
    });

});
