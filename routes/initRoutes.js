const express = require('express')
//const crypto = require('crypto')
//const Users = require('../models/users')
//const Sessions = require('../models/sessions')

const initController = require('../controllers/initController')


const router = express.Router()

router.route('/login').post(initController.login);
router.route('/register').post(initController.register)

module.exports = router;