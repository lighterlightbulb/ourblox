var express = require('express')
var router = express.Router()
var utils = require('../utils')

router.get('/', function (req, res) {
    res.render("home", { title: "Home", home: true })
})

router.get('/omg', utils.checkAuth, function (req, res) {
    res.send("This is a secret route that requires authenication!")
})

module.exports = router