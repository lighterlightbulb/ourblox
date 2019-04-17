/* Copyright 2019 Ourblox, All Rights Reserved */

//this file is included with most routes, it contains things that most routes would need such as access to the database and the auth checking function
var exports = module.exports = {}
var mysql  = require('mysql2')

var pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE
  })

exports.connection = pool

exports.checkAuth = function (req, res, next) {
 /*
	for whatever reason, this is broken, it's not needed but i might need it in the future so i'm commenting it out
		refresh.requestNewAccessToken('discord', profile.refreshToken, function(err, accessToken, refreshToken) {
    if (err)
       throw // boys, we have an error here.

    profile.accessToken = accessToken // store this new one for our new requests!
})
*/
    if (req.session.id) return next()
    res.redirect("/login")
}

exports.makeId = function (length) {
  var text = ""
  var possible = "abcdefghijklmnopqrstuvwxyz"

  for (var i = 0; i < length; i++)
    text += possible.charAt(Math.floor(Math.random() * possible.length))

  return text;
}

exports.sleep = function (ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

exports.make404 = function(res) {
    return res.status(404).render('404', { title: "404 Not Found" });
}