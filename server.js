const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const bodyParser = require('body-parser');
const moment = require('moment');

//You must make sure that you define all configurations 
//BEFORE defining routes. If you do so, you can continue 
//to use express.bodyParser().
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use(express.static('public'));

let joinUser = [];
let messages = [];

app.get('/login', function(req, res){
    res.sendFile(__dirname + '/login.html');
})

app.get('/',function(req,res){
    //res.sendFile(path.join(__dirname+'/index.html'));
    res.sendFile(__dirname + '/index.html');
});

app.post('/login', function(req, res){
    let username = req.body.username;
    res.redirect('/?username='+ username);
});

io.on('connection', function(socket){
    socket.on('user join', function(user){
        
        if(joinUser.length == 0){
            joinUser.push({id: socket.id, username: user});
            socket.broadcast.emit('user join', `${user} has join the chat`);
            socket.emit('user list', joinUser);
        }
        else if(joinUser.length > 0){
            //check if username exist
            let nonexist = true;

            for(let i = 0; i < joinUser.length; i++){
                if(user == joinUser[i].username){
                    nonexist = false;
                    joinUser[i].id = socket.id;
                }
            }
            if(nonexist){
                joinUser.push({id: socket.id, username: user})
                socket.broadcast.emit('user join', `${user} has join the chat`);
            }
            io.emit('user list', joinUser);
        }
        io.emit('messages', messages);
    })
    socket.on('disconnect', function(){
        //set timeout if user is disconnect, check if the socket-id change or not, if change it means they connect back, if not remove from the user list
        setTimeout(function(){
            //console.log(socket.id);
            for(let i = 0; i < joinUser.length; i++){
                if(joinUser[i].id == socket.id){
                    socket.broadcast.emit('user join', `${joinUser[i].username} has leave the chat`);
                    joinUser.splice(i, 1);
                    io.emit('user list', joinUser);
                    break;
                }
            }
        },5000)
    });
    socket.on('data send', function(data){
        messages.push({msg: data.msg, username: data.username, date: moment().format('LT')});
        console.log(messages);
        socket.broadcast.emit('data receive', {msg: data.msg, username: data.username, date: moment().format('LT')})
    });
 });

http.listen(3000, function(){
    console.log('listening on *:3000');
})


