var soap = require('./soap');
var fetch = require('fetch');
var exports = module.exports = {};

const config = require('./config.json');

exports.closeJob = function(next, id) {
    fetch(config.job.soapUrl, 
        {
            method: 'POST', 
            body: `${soap.body}<ns1:CloseJob><ns1:jobID>${id}</ns1:jobID></ns1:CloseJob>${soap.bodyEnd}` 
        }
    )
    .then(function(res) { if (!res.ok) return false; })
    .catch(err => next(err));

    return true;
}

exports.openJob = function(next, expiration, placeID, jobID) {
    fetch(config.job.soapUrl, 
        {
            method: 'POST', 
            body: 
               `<ns1:OpenJob>
                <ns1:job>
                    <ns1:id>${jobID}</ns1:id>
                    <ns1:expirationInSeconds>${expiration}</ns1:expirationInSeconds>
                </ns1:job>
                <ns1:script>
                    <ns1:name>Start Server</ns1:name>
                    <ns1:script>loadstring(game:HttpGet('https://ourblox.pw/game/gameserver.ashx?data=${placeID};0;${jobID};${config.job.assetUrl}', true))()</ns1:script>
                </ns1:script>
                </ns1:OpenJob>` 
        }
    )
    .then(function(res) { if (!res.ok) return false; })
    .catch(err => next(err));

    return true;
}