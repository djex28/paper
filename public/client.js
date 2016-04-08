var draw_color = {color: 'black'};
var line_width = {width: 5};
var is_rainbow = false;

document.addEventListener("DOMContentLoaded", function() {
   var mouse = { 
      click: false,
      move: false,
      pos: {x:0, y:0},
      pos_prev: false
   };
   // get canvas element and create context
   var canvas  = document.getElementById('drawing');
   var context = canvas.getContext('2d');
   var width   = window.innerWidth;
   var height  = window.innerHeight;    
   var socket  = io.connect();

   // set canvas to full browser width/height
   canvas.width = width;
   canvas.height = height;

   // register mouse event handlers
   canvas.onmousedown = function(e){ e.preventDefault(); mouse.click = true; };
   canvas.ontouchstart = canvas.onmousedown;
   canvas.onmouseup = function(e){ mouse.click = false; };
   canvas.ontouchend = function() {
       mouse.click = false;
   }

   canvas.onmousemove = function(e) {
      // normalize mouse position to range 0.0 - 1.0
      
      var clientX = e.clientX || e.touches[0].clientX;
      var clientY = e.clientY || e.touches[0].clientY;
      
      mouse.pos.x = clientX / width;
      mouse.pos.y = clientY / height;
      mouse.move = true;
   };
   canvas.ontouchmove = canvas.onmousemove;

   // draw line received from server
	socket.on('draw_line', function (data) {
      var line = data.line;
      context.beginPath();
      context.moveTo(line[0].x * width, line[0].y * height);
      context.lineTo(line[1].x * width, line[1].y * height);
      context.lineCap="round";
      context.strokeStyle = line[2].color; //getRandomColor()
      context.lineWidth = line[3].width; //getRandomArbitrary(1, 10)
      context.stroke();
   });
    
    socket.on('clear_canvas', function(data) {
       context.clearRect(0, 0, canvas.width, canvas.height); 
    });
    
    function getRandomArbitrary(min, max) {
        return Math.random() * (max - min) + min;
    }
    
    function getRandomColor() {
        var letters = '0123456789ABCDEF'.split('');
        var color = '#';
        for (var i = 0; i < 6; i++ ) {
            color += letters[Math.floor(Math.random() * 16)];
        }
        return color;
    }
   
   // main loop, running every 25ms
   function mainLoop() {
      // check if the user is drawing
      if (mouse.click && mouse.move && mouse.pos_prev) {
         // send line to to the server
         if (is_rainbow) 
             draw_color.color = getRandomColor();
         socket.emit('draw_line', { line: [ mouse.pos, mouse.pos_prev, draw_color, line_width ] });
         mouse.move = false;
      }
      mouse.pos_prev = {x: mouse.pos.x, y: mouse.pos.y};
      setTimeout(mainLoop, 25);
   }
   mainLoop();
});