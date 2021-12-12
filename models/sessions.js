const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const sessionSchema = new Schema({
    owner: String,
    token: String
}, {timestamps: true})

const Session = mongoose.model('Sessions', sessionSchema);

module.exports = Session;