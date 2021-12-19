const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
//const crypto = require('crypto')
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');
const http = require('http');
const socketio = require('socket.io')
const Users = require('./models/users')
const Chats = require('./models/chats')
//const Sessions = require('./models/sessions')
//const ObjectID = require('mongodb').ObjectID
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


// app.post('/login', (req, res) => {

//     var temp_contact;
//     var temp_chat;

//     let sessionid = crypto.randomBytes(8).toString('hex');

//    Users.find({username: req.body.username})
//    .then(val => {
//     if(val.length===0) {
//         res.send([])
//     }
//     if(val.length===1) {

//         if(val[0].password !== req.body.password) {
//             res.send([])
//         }

//         const findInfo = async () => {


//         const contacts = Promise.all(val[0].contacts.map(async (val) => {
//             await Users.find({_id: val})
//             .then(val => {
//                 temp_contact = { name: val[0].name,
//                     last_name: val[0].last_name,
//                     birthday: val[0].birthday,
//                     phone: val[0].phone,
//                     username: val[0].username,
//                     email: val[0].email,
//                     website: val[0].website,
//                     address: val[0].address,
//                     facebook: val[0].facebook,
//                     twitter: val[0].twitter,
//                     instagram: val[0].instagram,
//                     linkedin: val[0].linkedin,
//                     moto: val[0].moto,
//                     id: val[0]._id,
//                     profile_picture: val[0].profile_picture,
//                     last_seen: val[0].last_seen}
//             })
//             return temp_contact;
//         } 
//         ))

//         const chats = Promise.all(val[0].chats.map(async (val) => {
//             await Chats.find({_id: val})
//             .then(val => {
//                 temp_chat = {
//                     id: val[0]._id,
//                     content: val[0].content,
//                     owners: val[0].owners,
//                     type: val[0].type,
//                     updatedAt: val[0].updatedAt,
//                     name: val[0].name || undefined,
//                     picture: val[0].picture || undefined
//                 }
//             })
//             return temp_chat
//         }))

//         const cons = await contacts.then(contacts => {
//             val[0].contacts = contacts
//         })
//         const chts = await chats.then(chats => {
//             val[0].chats = chats
//         })

//         const session = new Sessions({
//             owner: JSON.stringify(val[0]._id),
//             token: sessionid
//         })
//         session.save()

//         res.header('Access-Control-Allow-Credentials', true);
//         res.cookie('sessionid', sessionid)
//         res.send(val)
//         }

//         if(val[0].password === req.body.password) findInfo()    
       
//     }
//    }).catch( console.log('problem'))

// })

// app.get('/cookiecheck', (req,res) => {
//     Sessions.find({token: req.cookies['sessionid']})
//     .then((val) => {
//         if(val.length>0) {
//             Users.find({_id: val[0].owner.slice(1,-1)})
//             .then((val) => {
//                 const findInfo = async () => {

//                     const contacts = Promise.all(val[0].contacts.map(async (val) => {
//                         await Users.find({_id: val})
//                         .then(val => {
//                             temp_contact = { name: val[0].name,
//                                 last_name: val[0].last_name,
//                                 birthday: val[0].birthday,
//                                 phone: val[0].phone,
//                                 username: val[0].username,
//                                 email: val[0].email,
//                                 website: val[0].website,
//                                 address: val[0].address,
//                                 facebook: val[0].facebook,
//                                 twitter: val[0].twitter,
//                                 instagram: val[0].instagram,
//                                 linkedin: val[0].linkedin,
//                                 moto: val[0].moto,
//                                 id: val[0]._id,
//                                 profile_picture: val[0].profile_picture,
//                                 last_seen: val[0].last_seen}
//                         })
//                         return temp_contact;
//                     } 
//                     ))
            
//                     const chats = Promise.all(val[0].chats.map(async (val) => {
//                         await Chats.find({_id: val})
//                         .then(val => {
//                             temp_chat = {
//                                 id: val[0]._id,
//                                 content: val[0].content,
//                                 owners: val[0].owners,
//                                 type: val[0].type,
//                                 updatedAt: val[0].updatedAt,
//                                 name: val[0].name || undefined,
//                                 picture: val[0].picture || undefined
//                             }
//                         })
//                         return temp_chat
//                     }))
            
//                     const cons = await contacts.then(contacts => {
//                         val[0].contacts = contacts
//                     })
//                     const chts = await chats.then(chats => {
//                         val[0].chats = chats
//                     })
            
//                     res.send(val)
//                     }
            
//                     findInfo()    
//             })
            
//         }
//         else {
//             res.send({result: false})
//         }
//     })
//     }

// )

// app.delete('/removecookie', (req,res) => {
//     Sessions.deleteOne({token: req.cookies['sessionid']})
//     .then(console.log('deleted cookie'))
// })

// app.post('/register', (req,res) => {
//     Users.find({username: req.body.username})
//     .then(val => {
//         if(val.length===0) {
//             const [name, lastname] = req.body.name.split(' ')
//             const newUser = new Users({
//                 name: name,
//                 birthday: new Date(),
//                 phone: '',
//                 email: req.body.email,
//                 website: '',
//                 address: '',
//                 facebook: '',
//                 twitter: '',
//                 instagram: '',
//                 linkedin: '',
//                 profile_picture: 'https://i.ibb.co/qYJXrpM/dog.jpg',
//                 last_seen: new Date(),
//                 password: req.body.password,
//                 username: req.body.username,
//                 contacts: [],
//                 notifications: [],
//                 chats: [],
//                 last_name: lastname,
//                 activechats: [],
//                 blocked: [],
//                 moto: 'Available to chat'
//             })
        
//             newUser.save().then('new user created')
        
//             res.send({status: 'ok'})
//         }
//         if(val.length>0) {
//             res.send({status: 'taken'})
//         }
//     })


  
// })

// app.post('/getcontacts', (req,res) => {

//     Users.find({_id: req.body.id})
//     .then((val) => {
//         const findInfo = async () => {

//             const contacts = Promise.all(val[0].contacts.map(async (val) => {
//                 await Users.find({_id: val})
//                 .then(val => {
//                     temp_contact = { name: val[0].name,
//                         last_name: val[0].last_name,
//                         birthday: val[0].birthday,
//                         phone: val[0].phone,
//                         email: val[0].email,
//                         website: val[0].website,
//                         address: val[0].address,
//                         facebook: val[0].facebook,
//                         twitter: val[0].twitter,
//                         instagram: val[0].instagram,
//                         linkedin: val[0].linkedin,
//                         moto: val[0].moto,
//                         id: val[0]._id,
//                         profile_picture: val[0].profile_picture,
//                         last_seen: val[0].last_seen}
//                 })
//                 return temp_contact;
//             } 
//             ))
       
//             const cons = await contacts.then(contacts => {
//                 res.send(contacts)
//             })
    
//             //res.send(cons)
//             }
    
//             findInfo()
//     }) 
// })

// app.post('/account', (req,res) => {
//     Users.updateOne({_id: req.body.id},{
//         $set: {
//             name: req.body.name,
//             last_name: req.body.last_name,
//             phone: req.body.phone,
//             birthday: req.body.birthday,
//             email: req.body.email,
//             website: req.body.website,
//             address: req.body.address,
//             moto: req.body.moto,
//             profile_picture: req.body.profile_picture
//         }
//     })
//     .then( val => {
//         console.log("updated account")
//         res.send("updated information")
//         }) 

// })

// app.post('/social', (req,res) => {
//     Users.updateOne({_id: req.body.id},{
//         $set: {
//             facebook: req.body.facebook,
//             twitter: req.body.twitter,
//             instagram: req.body.instagram,
//             linkedin: req.body.linkedin
//         }
//     })
//     .then( val => {
//         console.log("updated social")
//         res.send("updated information")
//         }) 

// })

// app.post('/passwordchange', (req,res) => {
//     Users.find({_id: req.body.id})
//     .then(val => {
//         console.log(val)
//         if(val[0].password !== req.body.cur) {
//             res.send({status: 'wrong_password'})
//         }
//         else {
//             Users.updateOne({_id: req.body.id}, {
//                 $set: {
//                     password: req.body.new
//                 }
//             }).then( res.send({status: 'ok'}))
//         }
//     })
// })

// app.post('/addnewgroup', (req,res) => {
//     const newchatid = ObjectID();

//     const groupchat = new Chats({
//         _id: newchatid,
//         content: [],
//         owners: req.body.owners,
//         type: 'group',
//         name: req.body.name,
//         picture: 'https://i.ibb.co/vYYB2RN/groupprofile.png'
//     })

//     groupchat.save().then(console.log("new group chat created"))

//     req.body.owners.forEach((id) => {
//         Users.updateOne({_id: id}, {
//             $push: {
//                 chats: newchatid.toHexString()
//             }
//         }).then(console.log("added group chats to chats"))

//         Users.updateOne({_id: id}, {
//             $push: {
//                 activechats: newchatid.toHexString()
//             }
//         }).then(console.log("added group chats to activechats"))
//     })
//     console.log(newchatid.toHexString())
//     res.send(newchatid.toHexString())

// })

// app.post('/addfriend', (req,res) => {

//     Users.find({username: req.body.username})
//     .then(val => {
//             if(val[0]) res.send({status:'true', id: val[0]._id})
//             else res.send({status: 'false'})
            
//     }).catch((err) => {
//             res.send({status: 'false'})
//     })
// })

// app.post('/create_newchat', (req,res) => {
//     const newchatid = ObjectID();
//     const owners = req.body.owners;
//     // friend param Only used to find iformation to send to the accepter of the request
//     const friend = owners.filter((id) => id !== req.body.accepted) 
//     var finalobject;

//     const chat = new Chats({
//         _id: newchatid,
//         content: [],
//         owners: owners,
//         type: 'friend',
//     })


//     chat.save().then(console.log("new chat created"))

//     owners.forEach((id) => {
//         var friend_id;

//         if(id === owners[0]) {
//             friend_id = owners[1]
//         }
//         else {
//             friend_id = owners[0]
//         }

//         Users.updateOne({_id: id} , {
//             $push: {
//                 chats: newchatid.toHexString(),
//                 contacts: friend_id
//             }
//         }).then(console.log(`added chat for ${id}`))
//     })

//     Users.find({_id: friend[0]}).then(val => {
//         finalobject = {
//             chatid: newchatid,
//             chatowners: owners,
//             name: val[0].name,
//             username: val[0].username,
//             last_name: val[0].last_name,
//             birthday: val[0].birthday,
//             phone: val[0].phone,
//             email: val[0].email,
//             website: val[0].website,
//             address: val[0].address,
//             facebook: val[0].facebook,
//             twitter: val[0].twitter,
//             instagram: val[0].instagram,
//             linkedin: val[0].linkedin,
//             moto: val[0].moto,
//             id: val[0]._id,
//             profile_picture: val[0].profile_picture,
//             last_seen: val[0].last_seen
//         }
//         return finalobject
//     }).then(final => res.send(final))


// })

// app.post('/last_seen', (req, res) => {
//     const temp = new Date()
//     const temp_2 = temp.setHours(temp.getHours()+2)
//     const time = new Date(temp_2)
//     Users.updateOne({_id: req.body.id}, {
//         $set: {
//             last_seen: time
//         }
//     }).then(res.send())
// })

// app.post('/notification', (req,res) => {

//     if(req.body.type === 'add') {
//         Users.updateOne({_id: req.body.id} ,{
//             $push: {
//                 notifications: req.body.item
//             }
//         })
//     }

//     if(req.body.type === 'remove') {
//         Users.find({_id: req.body.id})
//         .then(user => { return user[0].notifications })
//         .then(arr => arr.filter((not) => {
//             if(not.from_id !== req.body.from_id) return not
//         })).then(val => {
//             Users.updateOne({_id: req.body.id}, {
//                 $set: {
//                     notifications: val    
//                 }
//             }).then(console.log('updated notifcations'))
//         })


//         res.send()
//     }
// })

// app.post('/clearunread', (req,res) => {

//     if(req.body.chatid !== 'a') {
//     Chats.find({_id: req.body.chatid})
//     .then(val => {
//         if(val.length===0) {
//             res.send('error')
//             console.log('error')
//         }
//         if(val.length>0) {
//            var temparr = val[0].content.slice(0).reverse()
           
//             var finalarr = temparr.map((msg) => {

//             if(msg.read===false && msg.author!==req.body.id) {
//                 return {
//                     ...msg,
//                     read: true
//                 }
//             }
//             else { return msg }        
//         })

//         finalarr = finalarr.slice(0).reverse()

//         Chats.updateOne({_id: req.body.chatid}, {
//             $set: {
//                 content: finalarr
//             }
//         }).then(val => console.log(`updated chat ${req.body.chatid}`))
        

//         res.send('ok')
//         }
//     })
//     }
//     else res.send('error')
// })

// app.post('/block' , (req,res) => {
//     if(req.body.type==='block') {
//         Users.updateOne({_id: req.body.id}, {
//             $push: {
//                 blocked: req.body.toblock
//             },
//             $pull: {
//                 activechats: req.body.chatid
//             }
//         }).then(console.log('blocked user'))
//     }

//     if(req.body.type==='unblock') {
//         Users.updateOne({_id: req.body.id}, {
//             $push: {
//                 activechats: req.body.chatid
//             },
//             $pull: {
//                 blocked: req.body.tounblock
//             }
//         }).then(console.log('unblocked user'))
//     }
//     res.send('ok')
// })

// app.post('/updateactivechats', (req,res) => {

//     if(req.body.type==='add') {
//         Users.updateOne({_id: req.body.id}, {
//             $push: {
//                 activechats: req.body.chatid
//             }
//         }).then(console.log('updated activechats'))

//         res.send('ok')
//     }

//     if(req.body.type==='remove') {
//         Users.updateOne({_id: req.body.id}, {
//             $pull: {
//                 activechats: req.body.chatid
//             }
//         }).then(console.log('updated activechats'))

//         res.send('ok')
//     }

        
// })
