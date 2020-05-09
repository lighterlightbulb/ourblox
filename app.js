/*
    Ourblox Website
    Made by 1002, swirln
    Contact: ozzt@protonmail.com, sw1rlnn@gmail.com

    Copyright 2019 Ourblox, All Rights Reserved
*/

//'use strict'

//modules
require('dotenv').config()
const express = require('express')
const exphbs  = require('express-handlebars')
const session  = require('cookie-session')
const bodyParser = require('body-parser')
const morgan = require('morgan')
const database = require('./database')
const moment = require('moment')
const fs = require('fs')
const http = require('http')
const https = require('https')

const app = express()

const privateKey = fs.readFileSync('ssl/server.key', 'utf8')
const certificate = fs.readFileSync('ssl/server.crt', 'utf8')
const credentials = {key: privateKey, cert: certificate}

const accessControl = require('express-ip-access-control')
const options = {
    mode: 'allow',
    allows: ['71.114.57.246', '::ffff:192.168.1.1', '192.168.1.1', '127.0.0.1', '::1',],
    log: false,
    statusCode: 401,
    message: '401 Unauthorized: This service is not intended for public use.'
}

app.set('trust proxy', ['173.245.48.0/20', '103.21.244.0/22', '103.22.200.0/22', '103.31.4.0/22', '141.101.64.0/18', '108.162.192.0/18', '190.93.240.0/20', '188.114.96.0/20', '197.234.240.0/22', '198.41.128.0/17', '162.158.0.0/15', '104.16.0.0/12', '172.64.0.0/13', '131.0.72.0/22'])

app.use(accessControl(options))

app.use(express.static('static'))

//session
app.use(session({
	name: process.env.SESSION_NAME,
    secret: process.env.SESSION_SECRET,

    maxAge: 24 * 60 * 60 * 1000 // 24 hours
}))

app.use(async function (req, res, next) {
  if (req.session.id) {
    const user = await database.fetchUser(next, req.session.id)
    req.session.username = user[0].username
    await database.updateLastSeen(next, req.session.id)
    next()
  } else {
    next()
  }
})

//logging
app.use(morgan('dev'))

//use res/req in handlebars
app.use(function(req,res,next){
    res.locals.req = req
	res = res
    next()
})

app.disable('x-powered-by')

app.engine('handlebars', exphbs({
  defaultLayout: 'main',
  helpers: {
      eq: function (v1, v2) {
          return v1 === v2;
      },
      ne: function (v1, v2) {
          return v1 !== v2;
      },
      lt: function (v1, v2) {
          return v1 < v2;
      },
      gt: function (v1, v2) {
          return v1 > v2;
      },
      lte: function (v1, v2) {
          return v1 <= v2;
      },
      gte: function (v1, v2) {
          return v1 >= v2;
      },
      and: function () {
          return Array.prototype.slice.call(arguments).every(Boolean);
      },
      or: function () {
          return Array.prototype.slice.call(arguments, 0, -1).some(Boolean);
      },
      math: function (v1, v2) {
        return v1 + v2;
      },
      repeat: function(n, block) {
        var accum = ''
        for(var i = 0; i < n; ++i)
            accum += block.fn(i)
        return accum
      },
      plural: function (v1) {
        if (v1 === 0 || v1 > 1) return "s"
      },
      date: function (v1, v2) {
        switch (v1) {
          case 0:
            return moment(Number(v2)).format("M/D/YYYY h:mm a")
          case 1:
            return moment(Number(v2)).format("M/D/YYYY h:mm:ss a")
        }
      }
    }
}))

app.set('view engine', 'handlebars')
app.use(bodyParser.urlencoded({ extended: false }))

//It's time for the routes.

const main = require('./routes/main')
const auth = require('./routes/auth')
const games = require('./routes/games')
const users = require('./routes/users')
const catalog = require('./routes/catalog')
const api = require('./routes/api')
const character = require('./routes/character')

app.use('/', main)
app.use('/', auth)
app.use('/games', games)
app.use('/', users)
app.use('/catalog', catalog)
app.use('/', api)
app.use('/character', character)

app.all('/*', function (req, res) {
  res.status(404).render('404', { title: "404 Not Found" })
})

const httpServer = http.createServer(app)
const httpsServer = https.createServer(credentials, app)

httpServer.listen(process.env.PORT, () => {
	console.log('Application server running on port 80')
});

httpsServer.listen(process.env.PORT_SSL, () => {
	console.log('Application server running on port 443')
});