var express = require('express'),
    mongoose = require('mongoose'),
    app = express(),
    http = require('http'),
    socketIo = require('socket.io');

mongoose.connect('mongodb://localhost:27017/lines');
var LineSchema = new mongoose.Schema({
  line: {type: Object}
});
mongoose.model('Line', LineSchema);
var Line = mongoose.model('Line');

//removeAll();
// array of all lines drawn
var line_history = [];

function insert(data) {
    var line = new Line({line : data});
    line.save(function (err) {
      if (err) {
        console.log(err);
      } 
    });
}

function getAll() {
    Line.find({}, 'line', function (err, docs) {
        if (err) {
            console.log(err)
        } 
        for (var i in docs) {
            line_history[i] = docs[i].line;
        }
    });
}

function removeAll() {
    line_history = [];
    Line.remove({}, function(err) {
        if (err) {
            console.log(err)
        } 
    });
}

getAll();

/*----------ROUTES-----------*/

var router = express.Router();

router.get('/lines', function(req, res, next) {
  Line.find(function(err, lines){
    if(err){ return next(err); }
    res.json(lines);
  });
});

router.post('/removeall', function(req, res, next) {
  removeAll();
  io.emit('clear_canvas', 0);
});

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

module.exports = router;

// start webserver on port 3007
var server =  http.createServer(app);
var io = socketIo.listen(server);
server.listen(3007);
// add directory with our static files
app.use(express.static(__dirname + '/public'));
app.use('/', router);
console.log("Server running on 52.25.66.9:3007");

// event-handler for new incoming connections
io.on('connection', function (socket) {
    
   // first send the history to the new client
   for (var i in line_history) {
      socket.emit('draw_line', { line: line_history[i] } );
   }

   // add handler for message type "draw_line".
   socket.on('draw_line', function (data) {
        // add received line to history 
        line_history.push(data.line);
       
        // make persistant
        insert(data.line);
       
        // send line to all clients
        io.emit('draw_line', { line: data.line });
   });
});