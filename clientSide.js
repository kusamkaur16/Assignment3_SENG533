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
      let message = msg.message.replace('<li>', '<li class="bold">');
      $('#incomingMessages').append(message);
    } else {
      $('#incomingMessages').append(msg.message);
    }
    window.scrollTo(0, document.main.scrollHeight);
  });

  socket.on('new name', function(msg) {
    name = msg.name;
    $('#name').append(name);
    $('#incomingMessages').append(msg.history);
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
