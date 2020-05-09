/* Copyright 2019 Ourblox, All Rights Reserved */

const express = require('express')
const router = express.Router()
const utils = require('../utils')
const database = require('../database')

router.get('/', async function (req, res, next) {
    res.render('character', { title: 'Character' })
})

module.exports = router