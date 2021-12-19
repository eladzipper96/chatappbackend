const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');
const http = require('http');
const socketio = require('socket.io')
const Users = require('./models/users')
const Chats = require('./models/chats')
const userRouters = require('./routes/userRoutes')
const initRouters = require('./routes/initRoutes')
const cookieRouters = require('./routes/cookieRoutes')

const app = express()
dotenv.config()

const corsOptions = {
    origin: true, 
    credentials: true,
};

// Middleware 
app.use(cors(corsOptions))
app.use(cookieParser());
app.use(express.json())


// Routers
app.use('/init', initRouters)
app.use('/user', userRouters)
app.use('/cookie', cookieRouters)


// Creating Server manually required for Socket.IO
const server = http.createServer(app)
const io = socketio(server , {
    cors: {
      origin: true,
      methods: ["GET", "POST"]
    }
  })

// Socket.IO 
  io.on('connection', (socket) => {

    // Disconnecting Temp Sockets
    if(socket.handshake.query.chatid.length<5) {
        socket.disconnect()
        console.log("disconnected temp socket")
    }
    else {
        // Connecting the User to a Chat Room
        socket.join(socket.handshake.query.chatid)

        console.log('new connection to')
        console.log(socket.handshake.query.chatid)
    
        // Socket.IO EventListners
        
        socket.on('message', (obj) => {
            io.to(obj.chatid).emit('message', obj)
            console.log(obj )
            Chats.updateOne({_id: obj.chatid}, {
                $push: { 
                    content: {
                        author: obj.author,
                        authorname: obj.authorname,
                        value: obj.value,
                        id: obj.id,
                        time: obj.time,
                        year: obj.year,
                        read: false
                    }
                 }   
            }).then(console.log("updated chat"))
        })


        socket.on('newgroup', (obj) => {
            io.to(socket.handshake.query.chatid).emit('newgroup', obj)
            console.log(obj)
        })

        socket.on('lastseen',(time) => {
            io.to(socket.handshake.query.chatid).emit('lastseen', time)
            socket.disconnect()
        })

        socket.on('friendrequest', (obj) => {
            console.log(obj)
            io.to(socket.handshake.query.chatid).emit('friendrequest', obj)
            socket.disconnect()

            Users.updateOne({username: obj.username}, {
                $push: {
                    notifications: {
                        type: 'friend_request',
                        from_name: obj.sender_name,
                        from_id: obj.sender_id,
                        time: obj.time,
                        picture: obj.picture
                    }
                }
            }).then(console.log('sent friend req'))
        })

        socket.on('acceptfriend', (obj) => {
            console.log("on acceptfriend")
            var date = new Date()
            var date = new Date(date.setHours(date.getHours()+2))
            const datesr = date.toISOString().toString(11,16)
            
            console.log(obj)
            io.to(socket.handshake.query.chatid).emit('acceptfriend', obj)
            socket.disconnect()

            Users.updateOne({_id: socket.handshake.query.chatid}, {
                $push: {
                    notifications: {
                        type: 'friend_accept',
                        from_name: obj.name+" "+obj.last_name,
                        from_id: obj.id,
                        picture: obj.profile_picture,
                        time: datesr
                    }
                }
            }).then(console.log('friend request accept sent'))
        })

        socket.on('deletesocket', () => {
            socket.disconnect()
        })
    
        socket.on('disconnect', () => {
            console.log("a disconnection")
        })

    }

})

const dbURI = process.env.MONGO_DB_URI

mongoose.connect(dbURI)
.then((res) => {
    server.listen(process.env.PORT)
    console.log("connected to db")
})
.catch((res) => console.log("not connected"))

