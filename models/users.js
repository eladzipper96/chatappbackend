const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema({
    username: String,
    password: String,
    name: String,
    last_name: String,
    email: String,
    phone: String,
    birthday: Date,
    website: String,
    address: String,
    facebook: String,
    twitter: String,
    instagram: String,
    linkedin: String,
    profile_picture: String,
    last_seen: String,
    contacts: Array,
    notifications: Array,
    chats: Array,
    activechats: Array,
    blocked: Array,
    moto: String,


}, {timestamps: true})

const User = mongoose.model('users', userSchema);

module.exports = User;