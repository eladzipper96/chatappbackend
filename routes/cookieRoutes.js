const express = require('express')
const cookieController = require('../controllers/cookieController')

const router = express.Router()

router.route('/')
.get(cookieController.cookieCheck)
.delete(cookieController.deleteCookie)

module.exports = router