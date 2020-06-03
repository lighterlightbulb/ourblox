/*
    Ourblox Website
    Made by 1002, swirln
    Contact: ozzt@shit.software, lightbulblighter@gmail.com

    MIT Licensed
	A copy of the MIT license is available in the "LICENSE" file.
*/

var soap = require('./soap')
var fetch = require('node-fetch')
var exports = module.exports = {}

require('dotenv').config()

exports.closeJob = function(next, id) {
    fetch(config.job.soapUrl, 
        {
            method: 'POST', 
            body: `${soap.body}<ns1:CloseJob><ns1:jobID>${id}</ns1:jobID></ns1:CloseJob>${soap.bodyEnd}` 
        }
    )
    .then(function(res) { if (!res.ok) return false; })
    .catch(err => next(err))

    return true
}

exports.openJob = function(next, expiration, placeID, jobID) {
    fetch(config.job.soapUrl, 
        {
            method: 'POST', 
            body: 
               `${soap.body}<ns1:OpenJob>
                <ns1:job>
                    <ns1:id>${jobID}</ns1:id>
                    <ns1:expirationInSeconds>${expiration}</ns1:expirationInSeconds>
                </ns1:job>
                <ns1:script>
                    <ns1:name>Start Server</ns1:name>
                    <ns1:script>loadstring(game:HttpGet('https://ourblox.pw/game/gameserver.ashx?data=${placeID};0;${jobID};${process.env.SOAP_ASSETURL}', true))()</ns1:script>
                </ns1:script>
                </ns1:OpenJob>${soap.bodyEnd}` 
        }
    )
    .then(function(res) { if (!res.ok) return next("Gameserver returned error")})
    .catch(err => next(err))

    return true
}