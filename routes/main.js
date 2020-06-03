/*
    Ourblox Website
    Made by 1002, lightbulblighter
    Contact: ozzt@shit.software, lightbulblighter@gmail.com

    MIT Licensed
	A copy of the MIT license is available in the "LICENSE" file.
*/

var express = require('express')
var router = express.Router()
var utils = require('../utils')

router.get('/', function (req, res) {
    res.render("home", { title: "Home" })
})

router.get('/omg', utils.checkAuth, function (req, res) {
    res.send("This is a secret route that requires authenication!")
})

module.exports = router