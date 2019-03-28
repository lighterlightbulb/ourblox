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
var mysql  = require('mysql2')
var bodyParser = require('body-parser')
var morgan = require('morgan')

var connection = mysql.createConnection({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE
})

var app = express()

connection.connect(function(err) {
  if (err) {
    console.error('Error connecting to MySQL: ' + err.stack)
    return
  }

  console.log('Connected to MySQL as ID ' + connection.threadId)
})

passport.serializeUser(function(user, done) {
  done(null, user)
})
passport.deserializeUser(function(obj, done) {
  done(null, obj)
})

var discordStrat = new DiscordStrategy({
    clientID: process.env.DISCORD_ID,
    clientSecret: process.env.DISCORD_SECRET,
    callbackURL: 'http://localhost:3000/callback',
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

app.engine('handlebars', exphbs({defaultLayout: 'main'}))

app.set('view engine', 'handlebars')
app.use(bodyParser.urlencoded({ extended: false }))

//It's time for the routes.

const main = require('./routes/main')
const auth = require('./routes/auth')

app.use('/', main)
app.use('/', auth)

app.listen(process.env.SERVER_PORT, function () {
    console.log(`Application server running on port ${process.env.SERVER_PORT}`)
})