const crypto = require('crypto')
const Users = require('../models/users')
const Chats = require('../models/chats')
const Sessions = require('../models/sessions')

exports.login = (req, res) => {

    var temp_contact;
    var temp_chat;

    let sessionid = crypto.randomBytes(8).toString('hex');

   Users.find({username: req.body.username})
   .then(val => {
    if(val.length===0) {
        res.send([])
    }
    if(val.length===1) {

        if(val[0].password !== req.body.password) {
            res.send([])
        }

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

        const session = new Sessions({
            owner: JSON.stringify(val[0]._id),
            token: sessionid
        })
        session.save()

        res.header('Access-Control-Allow-Credentials', true);
        res.cookie('sessionid', sessionid)
        res.send(val)
        }

        if(val[0].password === req.body.password) findInfo()    
       
    }
   }).catch( console.log('problem'))

}

exports.register = (req,res) => {
    Users.find({username: req.body.username})
    .then(val => {
        if(val.length===0) {
            const [name, lastname] = req.body.name.split(' ')
            const newUser = new Users({
                name: name,
                birthday: new Date(),
                phone: '',
                email: req.body.email,
                website: '',
                address: '',
                facebook: '',
                twitter: '',
                instagram: '',
                linkedin: '',
                profile_picture: 'https://i.ibb.co/qYJXrpM/dog.jpg',
                last_seen: new Date(),
                password: req.body.password,
                username: req.body.username,
                contacts: [],
                notifications: [],
                chats: [],
                last_name: lastname,
                activechats: [],
                blocked: [],
                moto: 'Available to chat'
            })
            newUser.save().then('new user created')
        
            res.send({status: 'ok'})
        }
        if(val.length>0) {
            res.send({status: 'taken'})
        }
    }) 
}