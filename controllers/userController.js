const Users = require('../models/users')
const Chats = require('../models/chats')
const ObjectID = require('mongodb').ObjectID

exports.getContacts = (req,res) => {

    Users.find({_id: req.body.id})
    .then((val) => {
        const findInfo = async () => {

            const contacts = Promise.all(val[0].contacts.map(async (val) => {
                await Users.find({_id: val})
                .then(val => {
                    temp_contact = { name: val[0].name,
                        last_name: val[0].last_name,
                        birthday: val[0].birthday,
                        phone: val[0].phone,
                        email: val[0].email,
                        website: val[0].website,
                        address: val[0].address,
                        facebook: val[0].facebook,
                        twitter: val[0].twitter,
                        instagram: val[0].instagram,
                        linkedin: val[0].linkedin,
                        moto: val[0].moto,
                        id: val[0]._id,
                        profile_picture: val[0].profile_picture,
                        last_seen: val[0].last_seen}
                })
                return temp_contact;
            } 
            ))
                const cons = await contacts.then(contacts => {
                res.send(contacts)
            })
            }
            findInfo()
    }) 
}

exports.updateMainInfo = (req,res) => {
    Users.updateOne({_id: req.body.id},{
        $set: {
            name: req.body.name,
            last_name: req.body.last_name,
            phone: req.body.phone,
            birthday: req.body.birthday,
            email: req.body.email,
            website: req.body.website,
            address: req.body.address,
            moto: req.body.moto,
            profile_picture: req.body.profile_picture
        }
    })
    .then( val => {
        console.log("updated account")
        res.send("updated information")
        }) 
}

exports.updateSocial = (req,res) => {
    Users.updateOne({_id: req.body.id},{
        $set: {
            facebook: req.body.facebook,
            twitter: req.body.twitter,
            instagram: req.body.instagram,
            linkedin: req.body.linkedin
        }
    })
    .then( val => {
        console.log("updated social")
        res.send("updated information")
        }) 
}

exports.updatePassword = (req,res) => {
    Users.find({_id: req.body.id})
    .then(val => {
        console.log(val)
        if(val[0].password !== req.body.cur) {
            res.send({status: 'wrong_password'})
        }
        else {
            Users.updateOne({_id: req.body.id}, {
                $set: {
                    password: req.body.new
                }
            }).then( res.send({status: 'ok'}))
        }
    })
}

exports.updateLastSeen = (req, res) => {
    const temp = new Date()
    const temp_2 = temp.setHours(temp.getHours()+2)
    const time = new Date(temp_2)
    Users.updateOne({_id: req.body.id}, {
        $set: {
            last_seen: time
        }
    }).then(res.send())
}

exports.updateNotifications = (req,res) => {

    if(req.body.type === 'add') {
        Users.updateOne({_id: req.body.id} ,{
            $push: {
                notifications: req.body.item
            }
        })
    }

    if(req.body.type === 'remove') {
        Users.find({_id: req.body.id})
        .then(user => { return user[0].notifications })
        .then(arr => arr.filter((not) => {
            if(not.from_id !== req.body.from_id) return not
        })).then(val => {
            Users.updateOne({_id: req.body.id}, {
                $set: {
                    notifications: val    
                }
            }).then(console.log('updated notifcations'))
        })
        res.send()
    }
}

exports.updateUnread = (req,res) => {

    if(req.body.chatid !== 'a') {
    Chats.find({_id: req.body.chatid})
    .then(val => {
        if(val.length===0) {
            res.send('error')
            console.log('error')
        }
        if(val.length>0) {
           var temparr = val[0].content.slice(0).reverse()
           
            var finalarr = temparr.map((msg) => {

            if(msg.read===false && msg.author!==req.body.id) {
                return {
                    ...msg,
                    read: true
                }
            }
            else { return msg }        
        })

        finalarr = finalarr.slice(0).reverse()

        Chats.updateOne({_id: req.body.chatid}, {
            $set: {
                content: finalarr
            }
        }).then(val => console.log(`updated chat ${req.body.chatid}`))
        

        res.send('ok')
        }
    })
    }
    else res.send('error')
}

exports.updateBlocked = (req,res) => {
    if(req.body.type==='block') {
        Users.updateOne({_id: req.body.id}, {
            $push: {
                blocked: req.body.toblock
            },
            $pull: {
                activechats: req.body.chatid
            }
        }).then(console.log('blocked user'))
    }

    if(req.body.type==='unblock') {
        Users.updateOne({_id: req.body.id}, {
            $push: {
                activechats: req.body.chatid
            },
            $pull: {
                blocked: req.body.tounblock
            }
        }).then(console.log('unblocked user'))
    }
    res.send('ok')
}

exports.updateActiveChats = (req,res) => {

    if(req.body.type==='add') {
        Users.updateOne({_id: req.body.id}, {
            $push: {
                activechats: req.body.chatid
            }
        }).then(console.log('updated activechats'))

        res.send('ok')
    }

    if(req.body.type==='remove') {
        Users.updateOne({_id: req.body.id}, {
            $pull: {
                activechats: req.body.chatid
            }
        }).then(console.log('updated activechats'))

        res.send('ok')
    }
       
}

exports.createGroup = (req,res) => {
    const newchatid = ObjectID();

    const groupchat = new Chats({
        _id: newchatid,
        content: [],
        owners: req.body.owners,
        type: 'group',
        name: req.body.name,
        picture: 'https://i.ibb.co/vYYB2RN/groupprofile.png'
    })

    groupchat.save().then(console.log("new group chat created"))

    req.body.owners.forEach((id) => {
        Users.updateOne({_id: id}, {
            $push: {
                chats: newchatid.toHexString()
            }
        }).then(console.log("added group chats to chats"))

        Users.updateOne({_id: id}, {
            $push: {
                activechats: newchatid.toHexString()
            }
        }).then(console.log("added group chats to activechats"))
    })
    console.log(newchatid.toHexString())
    res.send(newchatid.toHexString())

}

exports.createChat = (req,res) => {
    const newchatid = ObjectID();
    const owners = req.body.owners;
    // friend param Only used to find iformation to send to the accepter of the request
    const friend = owners.filter((id) => id !== req.body.accepted) 
    var finalobject;

    const chat = new Chats({
        _id: newchatid,
        content: [],
        owners: owners,
        type: 'friend',
    })


    chat.save().then(console.log("new chat created"))

    owners.forEach((id) => {
        var friend_id;

        if(id === owners[0]) {
            friend_id = owners[1]
        }
        else {
            friend_id = owners[0]
        }

        Users.updateOne({_id: id} , {
            $push: {
                chats: newchatid.toHexString(),
                contacts: friend_id
            }
        }).then(console.log(`added chat for ${id}`))
    })

    Users.find({_id: friend[0]}).then(val => {
        finalobject = {
            chatid: newchatid,
            chatowners: owners,
            name: val[0].name,
            username: val[0].username,
            last_name: val[0].last_name,
            birthday: val[0].birthday,
            phone: val[0].phone,
            email: val[0].email,
            website: val[0].website,
            address: val[0].address,
            facebook: val[0].facebook,
            twitter: val[0].twitter,
            instagram: val[0].instagram,
            linkedin: val[0].linkedin,
            moto: val[0].moto,
            id: val[0]._id,
            profile_picture: val[0].profile_picture,
            last_seen: val[0].last_seen
        }
        return finalobject
    }).then(final => res.send(final))
}

exports.addFriend = (req,res) => {

    Users.find({username: req.body.username})
    .then(val => {
            if(val[0]) res.send({status:'true', id: val[0]._id})
            else res.send({status: 'false'})
            
    }).catch((err) => {
            res.send({status: 'false'})
    })
}