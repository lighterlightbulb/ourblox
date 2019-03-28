var express = require('express')
var router = express.Router()
var utils = require('../utils')

router.get('/', function (req, res) {
    res.send("The app is ready! Hewwo!")
})

router.get('/omg', utils.checkAuth, function (req, res) {
    res.send("This is a secret route that requires authenication! Hewwo!")
})

module.exports = router