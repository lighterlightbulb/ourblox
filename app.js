/*
OurBlox Public Website
Developed by 1002
Contact: ozzt@protonmail.com
*/

//'use strict'

//modules
require('dotenv').config()
var express = require('express')
var exphbs  = require('express-handlebars')
var session  = require('cookie-session')
var passport = require('passport')
var DiscordStrategy = require('passport-discord').Strategy
var refresh = require('passport-oauth2-refresh')
var bodyParser = require('body-parser')
var morgan = require('morgan')
var utils = require('./utils')

var connection = utils.connection

var app = express()

passport.serializeUser(function(user, done) {
  done(null, user)
})
passport.deserializeUser(function(obj, done) {
  done(null, obj)
})

var discordStrat = new DiscordStrategy({
    clientID: process.env.DISCORD_ID,
    clientSecret: process.env.DISCORD_SECRET,
    callbackURL: process.env.DISCORD_CALLBACK,
    scope: ['identify']
}, function(accessToken, refreshToken, profile, done) {
    profile.refreshToken = refreshToken // store this for later refreshes
    process.nextTick(function() {
      connection.query('SELECT * FROM users WHERE snowflake = ?', profile.id, function (error, results, fields) {
        if (error) throw error

        if (results.length) {
          return done(null, profile)
        }
      })
    })
})

app.use(express.static('static'))

//logging
app.use(morgan('dev'))

passport.use(discordStrat)
refresh.use(discordStrat)

//use res/req in handlebars
app.use(function(req,res,next){
    res.locals.req = req
	res = res
    next()
})

//app.enable('trust proxy')
app.disable('x-powered-by');

//session
app.use(session({
	name: process.env.SESSION_NAME,
    secret: process.env.SESSION_SECRET,

    maxAge: 24 * 60 * 60 * 1000 // 24 hours
}))

app.use(passport.initialize())
app.use(passport.session())

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
      }
    },
}))

app.set('view engine', 'handlebars')
app.use(bodyParser.urlencoded({ extended: false }))

//It's time for the routes.

const main = require('./routes/main')
const auth = require('./routes/auth')
const games = require('./routes/games')

app.use('/', main)
app.use('/', auth)
app.use('/games', games)

app.all('/*', function (req, res) {
  res.status(404).render('404', { title: "404 Not Found" })
})

app.listen(process.env.SERVER_PORT, function () {
    console.log(`Application server running on port ${process.env.SERVER_PORT}`)
})