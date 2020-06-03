/*
    Ourblox Website
    Made by 1002, lightbulblighter
    Contact: ozzt@shit.software, lightbulblighter@gmail.com

    MIT Licensed
	A copy of the MIT license is available in the "LICENSE" file.
*/

const express = require('express')
const router = express.Router()
const utils = require('../utils')
const database = require('../database')

router.get('/users', async function (req, res, next) {
    const users = await database.fetchAllUsers(next)
    res.render('users', { title: 'Users', users: users })
})

router.get('/user', async function (req, res, next) {
    if (!req.query.id || isNaN(Number(req.query.id))) return utils.make404(res)
    const user = await database.fetchUser(next, req.query.id)
    if (!user.length) return utils.make404(res)

    res.render('user', { title: 'Users', users: true, user: user[0] })
})


module.exports = router