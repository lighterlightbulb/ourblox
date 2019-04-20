/* Copyright 2019 Ourblox, All Rights Reserved */

const express = require('express')
const router = express.Router()
const bcrypt = require('bcrypt')
const utils = require('../utils')
const database = require('../database')
const validator = require('validator')

router.get('/login', function (req, res) {
    res.render('auth/login', { title: 'Login' })
})

router.post('/login', async function (req, res, next) {
    const name = req.body.name
    const password = req.body.password
    
    if (!name) {
        return error("Please input a username.")
    } else if (name.length > 20) {
        return error("Username is longer than 20 characters.")
    } else if (!password) {
        return error("Please input a password.")
    } else if (password.length <= 10) {
        return error("Password is too short.")
    }
    
    const user = await database.fetchUserByName(next, name)

    if (!user.length) {
        return error("Invalid username or password.")
    }

    const match = await bcrypt.compare(password, user[0].password)

    if (match) {
        req.session.id = user[0].id
        res.redirect("/")
    } else {
        return error("Invalid username or password.")
    }

    function error(input) {
        res.render('auth/login', { title: 'Login', error: input })
    }
})

router.get('/register', function (req, res) {
    res.render('auth/register', { title: 'Register' })
})

router.post('/register', async function (req, res, next) {
    const name = req.body.name
    const email = req.body.email
    const password = req.body.password

    if (!name) {
        return error("Please input a username.")
    } else if (name.length > 20) {
        return error("Username is longer than 20 characters.")
    } else if (!email) {
        return error("Please input an email.")
    } else if (!validator.isEmail(email) || email.length > 254) {
        return error("Email is invalid.")
    } else if (!password) {
        return error("Please input a password.")
    } else if (password.length <= 10) {
        return error("Password is too short. Please use a unique and long password that has not been used on any other websites.")
    }
    
    const user = await database.fetchUserByName(next, name)

    if (user.length) {
        return error("That username is taken.")
    } else {
        bcrypt.hash(password, 10, async function (err, hash) {
            const user = await database.createUser(next, name, email, hash)
            console.log(user)
            res.redirect("/login?nu=1")
        })
    }

    function error(input) {
        res.render('auth/register', { title: 'Register', error: input })
    }
})

router.get('/logout', function (req, res) {
    req.session = null
    res.redirect('/')
})

//bcrypt.hash("fuck", 10).then(function(hash) {
    //console.log(hash)
//})
/*
router.get('/login', passport.authenticate('discord', { scope: ['identify'] }), function (req, res) {})

router.get('/callback',
    passport.authenticate('discord', { failureRedirect: '/' }), function (req, res) { res.redirect('/') } // auth success
)
*/

router.get('/data', utils.checkAuth, function (req, res) {
    //console.log(req.user)
    res.json(req.session)
})

module.exports = router