const Users = require('../models/users')
const Chats = require('../models/chats')
const Sessions = require('../models/sessions')

exports.cookieCheck = (req,res) => {
    Sessions.find({token: req.cookies['sessionid']})
    .then((val) => {
        if(val.length>0) {
            Users.find({_id: val[0].owner.slice(1,-1)})
            .then((val) => {
                const findInfo = async () => {

                    const contacts = Promise.all(val[0].contacts.map(async (val) => {
                        await Users.find({_id: val})
                        .then(val => {
                            temp_contact = { name: val[0].name,
                                last_name: val[0].last_name,
                                birthday: val[0].birthday,
                                phone: val[0].phone,
                                username: val[0].username,
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
            
                    const chats = Promise.all(val[0].chats.map(async (val) => {
                        await Chats.find({_id: val})
                        .then(val => {
                            temp_chat = {
                                id: val[0]._id,
                                content: val[0].content,
                                owners: val[0].owners,
                                type: val[0].type,
                                updatedAt: val[0].updatedAt,
                                name: val[0].name || undefined,
                                picture: val[0].picture || undefined
                            }
                        })
                        return temp_chat
                    }))
            
                    const cons = await contacts.then(contacts => {
                        val[0].contacts = contacts
                    })
                    const chts = await chats.then(chats => {
                        val[0].chats = chats
                    })
                    res.send(val)
                    }    
                    findInfo()    
            })    
        }
        else {
            res.send({result: false})
        }
    })
    }

exports.deleteCookie = (req,res) => {
        console.log(req.cookies['sessionid'])
        Sessions.deleteOne({token: req.cookies['sessionid']})
        .then(console.log('deleted cookie'))
    }