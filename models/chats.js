const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const chatsSchema = new Schema({
    content: Array,
    owners: Array,
    type: String,
    name: String,
    picture: String,
}, {timestamps: true})

const Chats = mongoose.model('chats', chatsSchema);

module.exports = Chats;