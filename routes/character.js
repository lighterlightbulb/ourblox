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

router.get('/', async function (req, res, next) {
    res.render('character', { title: 'Character' })
})

module.exports = router