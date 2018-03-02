$(function() {
  var socket = io();
  var name;

  var listUsers = function(arr) {

    let append = "";
    for (let i = 0; i < arr.length; i++) {
      append += "<li>" + arr[i].name + "</li>";
    }
    return append;
  }

  $(document).ready(function() {
    socket.emit('get name');
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
    if (msg.user == name) {
        console.log(msg.color);
      var bubble = "<div class='speech-bubbleMine'><div class = 'dialog'><p  style='color: " + msg.color + ";'>" + msg.message + "</p></div>" +
        "<div class ='time'>" + msg.time + "</div>" + "<div class = 'user'>" + msg.user + "</div>" +"</div>";
      let message = msg.message.replace('<li>', '<li class="bold">');
      $('#incomingMessages').append(bubble);
    } else {
      //add appropriate css
      var bubble = "<div class='speech-bubble'><div class = 'dialog'><p  style='color: " + msg.color + ";'>" + msg.message + "</p></div>" +
        "<div class ='time'>" + msg.time + "</div>" + "<div class = 'user'>" + msg.user + "</div>" +"</div>";
      $('#incomingMessages').append(bubble);
    }
    var div = $('#incomingMessages');
    div.scrollTop( div.get(0).scrollHeight );
  });

  socket.on('new name', function(msg) {
    name = msg.name;
    $('#name').append(name);
    //get the incomingMessages
    var retrievedMessages = "";

    for(var i = 0 ; i < msg.history.length ; i++){
        retrievedMessages += "<div class='speech-bubble'><div class = 'dialog'><p  style='color: " + msg.history[i].color + ";'>" + msg.history[i].message + "</p></div>" +
          "<div class ='time'>" + msg.history[i].time + "</div>" + "<div class = 'user'>" + msg.history[i].user + "</div>" +"</div>";

    }
    $('#incomingMessages').append(retrievedMessages);
  });
  socket.on('users', function(msg) {
    console.log('in here', msg);
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
  });

});
