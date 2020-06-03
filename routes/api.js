/*
    Ourblox Website
    Made by 1002, swirln
    Contact: ozzt@shit.software, lightbulblighter@gmail.com

    MIT Licensed
	A copy of the MIT license is available in the "LICENSE" file.
*/

const express = require('express')
const router = express.Router()
const database = require('../database')
const bodyParser = require('body-parser')
const base64 = require('base64-img')
const path = require('path')
const fs = require('fs')
const crypto = require('crypto')
const utils = require('../utils')

const keys = require(`../keys.json`)

router.get('/api/queue', async function (req, res, next) {
    const queue = await database.fetchQueue(next)
    res.json(queue)
})

router.get('/api/getshirt/:id', async function (req, res, next) {
    res.contentType("text/plain")
    res.render("char/shirt", {layout: false, id: req.params.id})
})

router.get('/api/getpants/:id', async function (req, res, next) {
    res.contentType("text/xml")
    res.render("char/pants", {layout: false, id: req.params.id})
})

router.get('/api/getgraphic/:id', async function (req, res, next) {
    res.contentType("text/xml")
    res.render("char/graphic", {layout: false, id: req.params.id})
})

router.get('/api/getdecal/:id', async function (req, res, next) {
    res.contentType("text/xml")
    res.render("char/decal", {layout: false, id: req.params.id})
})

router.post('/api/upload', bodyParser.text({type: 'text/plain', limit: '3mb' }), async function (req, res, next) {
    const queue = await database.fetchQueueById(next, req.query.id)
    const item = await database.fetchItem(next, queue[0].asset)

    base64.img(`data:image/png;base64,${req.body}`, '', `static/renders/${item[0].id}`, async function (err, filePath) {
        if (err) throw err
        await database.deleteQueue(next, req.query.id)
        res.json({success: true})
    })
})

router.get('/auth', function(req, res) {
	res.send('')
})

router.get(['/asset/*', '/asset'], async function(req, res, next) {
    if (!fs.existsSync(path.join(__dirname, `../assets`, req.query.id))) {
		return res.redirect(`https://assetgame.roblox.com/asset/?id=${req.query.id}`)
    }
        
    if (req.query.rcc) {
        const item = await database.fetchItem(next, req.query.id)
        switch (item[0].type) {
            case "shirt":
              return res.redirect(`/api/getshirt/${req.query.id}`)
            case "pants":
              return res.redirect(`/api/getpants/${req.query.id}`)
            case "tshirt":
              return res.redirect(`/api/getgraphic/${req.query.id}`)
            case "decal":
              return res.redirect(`/api/getdecal/${req.query.id}`)
        }
    }

    res.sendFile(path.join(__dirname, `../assets`, req.query.id))
})

router.get('//game/players/:id', function(req, res) {
	res.json({'ChatFilter': 'whitelist'})
})

router.post('/moderation/filtertext', function(req, res) {
	var filtered = utils.filter(req.body.text)
	res.json({"data": { "white": `${filtered.white}`, "black": `${filtered.black}`}})
})

router.post('/v1.1/Counters/Increment/', function(req, res) {
    res.send("")
})

router.post('/v1.1/RCCService/GameStart', function(req, res) {
	if (req.query.apiKey.toUpperCase() !== keys['v1.1']['/RCCService/GameStart']) {
		return res.send('The service is unavailable.')
	}
	
	res.send('MOK!')
})

router.get('/game/LuaWebService/HandleSocialRequest.ashx', function(req, res) {
	if (req.query.method === "IsInGroup" && req.query.groupid === "1200769" && req.query.playerid === "1" || req.query.playerid === "2" || req.query.playerid === "3") {
	    res.send('<Value Type="boolean">true</Value>')
	} else if (req.query.method === "IsInGroup") {
	    res.send('<Value Type="boolean">false</Value>')
	} else if (req.query.method === "GetGroupRank" && req.query.groupid === '1') {
	    res.send('<Value Type="integer">0</Value>')
	} else if (req.query.method === "GetGroupRank" && req.query.groupid === '2868472') {
	    res.send('<Value Type="integer">0</Value>')
	} else if (req.query.method === "GetGroupRank") {
	    res.send('<Value Type="integer">0</Value>')
	} else {
        res.send("no case")
	    console.log("no case")
	}
})

router.get('/user/get-friendship-count', function(req, res) {
	res.json({"success":true,"message":"Success","count":0})
})

router.get('/user/following-exists', function(req, res) {
	res.json({"success":true,"message":"Success","isFollowing":false})
})

router.get('/userblock/getblockedusers', function(req, res) {
	res.json({})
})

/*
router.post('/AbuseReport/InGameChatHandler.ashx', bodyParser.text({limit: '10MB'}), function(req, res) {
    var result = JSON.parse(convert.xml2json(req.body, {compact: true, spaces: 4}));
	
	console.log(result)
	console.log(result.report)
	console.log(result.report._attributes)
	console.log(`Abuse report recieved!
	Sender: ${result.report._attributes.userID}
	Place: ${result.report._attributes.placeID}
	Job: ${result.report._attributes.gameJobID}
	
	Comment:
	${result.comment._text}
	
	Messages:
	
	`)
	
	logger.log('api', 'blue', `Abuse report sent, content was: ${req.body}`, `Abuse report sent, content was: ${req.body}`);
	res.send('');
});
*/

router.get('/game/gameserver.ashx', function(req, res) {
	// reads text from game serber and outputs it BUT with epic args
	// no input validation....
	const data = req.query.data.split(';')
	
	var args = `start(${data[0]}, ${data[1]}, "${data[2]}", "${data[3]}")`
	var script = fs.readFileSync(`${util.root}/gameserver.txt`, 'utf8')
	
	res.send(`${script}\r\n${args}`)
})

router.get('/game/join', function(req, res) {
	const script = `\r\n{"ClientPort":0,"MachineAddress":"${req.query.ip}","ServerPort":${req.query.port},"PingUrl":"https://${config.url}/game/ping?id=${req.query.id}","PingInterval":30,"UserName":"${req.query.name}","SeleniumTestMode":false,"UserId":${req.query.id},"SuperSafeChat":false,"CharacterAppearance":"https://api.${config.url}/v1.1/avatar-fetch/?placeId=${req.query.placeid}&userId=${req.query.id}","ClientTicket":"","GameId":"00000000-0000-0000-0000-000000000000","PlaceId":${req.query.placeid},"MeasurementUrl":"","WaitingForCharacterGuid":"","BaseUrl":"http://assetgame.${config.url}/","ChatStyle":"ClassicAndBubble","VendorId":0,"ScreenShotInfo":"","VideoInfo":"<?xml version=\\"1.0\\"?><entry xmlns=\\"http://www.w3.org/2005/Atom\\" xmlns:media=\\"http://search.yahoo.com/mrss/\\" xmlns:yt=\\"http://gdata.youtube.com/schemas/2007\\"><media:group><media:title type=\\"plain\\"><![CDATA[ROBLOX Place]]></media:title><media:description type=\\"plain\\"><![CDATA[ For more games visit http://www.${config.url}]]></media:description><media:category scheme=\\"http://gdata.youtube.com/schemas/2007/categories.cat\\">Games</media:category><media:keywords>ROBLOX, video, free game, online virtual world</media:keywords></media:group></entry>","CreatorId":1,"CreatorTypeEnum":"User","MembershipType":"${req.query.bc}","AccountAge":${req.query.age},"CookieStoreFirstTimePlayKey":"rbx_evt_ftp","CookieStoreFiveMinutePlayKey":"rbx_evt_fmp","CookieStoreEnabled":true,"IsRobloxPlace":false,"GenerateTeleportJoin":false,"IsUnknownOrUnder13":false,"SessionId":"89e81fb5-d1c8-48a9-a127-5d0d6bddaaac|00000000-0000-0000-0000-000000000000|0|207.241.231.247|5|2016-11-27T15:55:58.4473206Z|0|null|null|37.7811|-122.4625|1","DataCenterId":0,"UniverseId":0,"BrowserTrackerId":0,"UsePortraitMode":false,"FollowUserId":${req.query.following},"characterAppearanceId":${req.query.id}}`
	const sign = crypto.createSign('SHA1');
	//input validation is not added because this is only for testing purposes, in production all data will be automatically filled in with already valided information
	sign.write(script)
	sign.end()

	const key = fs.readFileSync('../PRIVATEKEY_BASE64.txt')
	signature_b64 = sign.sign(key, 'base64');

	res.send(`--rbxsig%${signature_b64}%${script}`)
})

// Temporary solution, actually add validiation in production
router.get('/users/*/canmanage/*', function(req, res) {
	res.json({'Success': true, 'CanManage': true})
})

router.get('/Marketplace/ProductInfo', function(req, res) {
	res.json({
		'TargetId': 0, 
		'ProductType': null, 
		'AssetId': 101203942,
		'ProductId':0,
		'Name': 'Heaven',
		'Description': 'Decal',
		'AssetTypeId': 13,
		'Creator': {
			'Id': 1,
			'Name': 'God',
			'CreatorType': 'User',
			'CreatorTargetId': 1
		},
		'IconImageAssetId': 0,
		'Created': '2012-12-22T00:48:06.82Z',
		'Updated': '2012-12-22T00:48:06.82Z',
		'PriceInRobux': null,
		"PriceInTickets": null,
		'Sales': 0,
		'IsNew': false,
		'IsForSale': false,
		'IsPublicDomain': false,
		'IsLimited': false,
		'IsLimitedUnique': false,
		'Remaining': null,
		'MinimumMembershipLevel': 0,
		'ContentRatingTypeId': 0
	})
})

router.get('/universes/get-universe-containing-place', function(req, res) {
	res.json({'UniverseId': 0})
})

// Crash dumps / logs
router.post(['/Error/Grid.ashx', '/Error/Dmp.ashx', '/Error/Breakpad.ashx'], bodyParser.text({limit: '50MB'}), function(req, res) {
	var filename = req.query.filename.toString()
	filename = filename.substring(filename.lastIndexOf('\\')).replace('\\', '')
	
	fs.writeFile(`${util.root}/logs/dump/${filename}`, req.body, (err) => { if (err) throw err; })
	
	res.send('')
})

module.exports = router