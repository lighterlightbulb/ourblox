/* Copyright 2019 Ourblox, All Rights Reserved */

var express = require('express')
var router = express.Router()
var passport = require('passport')
var utils = require('../utils')

router.get('/login', passport.authenticate('discord', { scope: ['identify'] }), function (req, res) {})

router.get('/callback',
    passport.authenticate('discord', { failureRedirect: '/' }), function (req, res) { res.redirect('/') } // auth success
)

router.get('/logout', function (req, res) {
    req.logout()
    res.redirect('/')
})

router.get('/data', utils.checkAuth, function (req, res) {
    //console.log(req.user)
    res.json(req.user)
})

module.exports = router