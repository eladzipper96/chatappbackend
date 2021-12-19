const express = require('express')
const userController = require('../controllers/userController')

const router = express.Router()

// Get Route-
router.route('/get/contacts').get(userController.getContacts)

// Might Create a new Route - Update Route
router.route('/update/main').post(userController.updateMainInfo)
router.route('/update/social').post(userController.updateSocial)
router.route('/update/password').post(userController.updatePassword)
router.route('/update/lastseen').post(userController.updateLastSeen)
router.route('/update/notifciations').post(userController.updateNotifications)
router.route('/update/unread').post(userController.updateUnread)
router.route('/update/block').post(userController.updateBlocked)
router.route('/update/activechats').post(userController.updateActiveChats)

//Might Create a new Route - Create Route
router.route('/create/group').post(userController.createGroup)
router.route('/create/chat').post(userController.createChat)

// Might Create a new Route - Add Route
router.route('/add/friend').post(userController.addFriend)

module.exports = router