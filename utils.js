var exports = module.exports = {}

exports.checkAuth = function (req, res, next) {
 /*
	for whatever reason, this is broken, it's not needed but i might need it in the future so i'm commenting it out
		refresh.requestNewAccessToken('discord', profile.refreshToken, function(err, accessToken, refreshToken) {
    if (err)
       throw // boys, we have an error here.

    profile.accessToken = accessToken // store this new one for our new requests!
})
*/
    if (req.isAuthenticated()) return next()
    res.redirect("/login")
}