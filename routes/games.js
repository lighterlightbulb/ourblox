var express = require('express')
var router = express.Router()
var utils = require('../utils')
var soap = require('../soap')
const fetch = require('node-fetch')

var connection = utils.connection

async function pingChecker(id, next, firstrun) {
  function checkStatus(res) {
    if (!res.ok) { // res.status >= 200 && res.status < 300
        next("Gameserver returned error")
    }
  }

  if (!firstrun) {
    console.log(`checking ${id}`)
    const [job] = await connection.promise().query('SELECT * FROM jobs WHERE name = ? AND deleted = 0', id).catch(err => next(err))

    if (job[0].lastping < Date.now() - 5000) {
      console.log(`did not ping, removing ${id}`)
      await connection.promise().query('UPDATE jobs SET deleted = 1 WHERE name = ?', id).catch(err => next(err))
    } else if (job[0].players === 0) {
      fetch('http://192.168.1.224:64989', { method: 'POST', body: `${soap.body}<ns1:CloseJob><ns1:jobID>${id}</ns1:jobID></ns1:CloseJob>${soap.bodyEnd}` })
      .then(checkStatus)
      .catch(err => next(err))
      await connection.promise().query('UPDATE jobs SET deleted = 1 WHERE name = ?', id).catch(err => next(err))
    }
  } else {
    setTimeout(function(){pingChecker(id, next)}, 40000)
  }
}

router.get('/', async function (req, res, next) {
    let gamesArr = [];
    var [games] = await connection.promise().query('SELECT * FROM games').catch(err => next(err))

    for (var i = 0, len = games.length; i < len; i++) {
      gamesArr.push({id: games[i].id, name: games[i].name, creator: games[i].creator})
    }

    res.render("games/main", { title: "Games", fontAwesome: true, games: true, results: gamesArr })
})

router.get('/my', async function (req, res, next) {
    let gamesArr = []
    const [games] = await connection.promise().query('SELECT * FROM games WHERE creator = ?', req.user.id).catch(err => next(err))

    for (var i = 0, len = games.length; i < len; i++) {
      gamesArr.push({id: games[i].id, name: games[i].name, creator: games[i].creator})
    }

    res.render("games/main", { title: "Games", fontAwesome: true, games: true, results: gamesArr })
})

router.get('/new', utils.checkAuth, function (req, res) {
    res.render("games/new", { title: "New Game", games: true })
})

router.post('/new', utils.checkAuth, async function (req, res, next) {
    const name = req.body.name.trim()
    const description = req.body.description.trim()
    const maxplayers = req.body.maxplayers

    if (!name) {
      complete("The game name cannot be empty.")
    } else if (name.length > 20) {
      complete("The game name cannot be more than 20 characters.")
    } else if (description.length > 2000) {
      complete("The game name cannot be more than 2,000 characters.")
    } else if (!maxplayers) {
      complete("The max players cannot be empty.")
    } else if (isNaN(maxplayers)) {
      complete("The max players must be a number.")
    } else if (maxplayers > 200) {
      complete("The max players cannot be greater than 200.")
    } else {
      const [game] = await connection.promise().query('INSERT into games SET name = ?, creator = ?, description = ?, createdon = ?, modifiedon = ?', [name, req.user.id, description, Date.now(), Date.now()]).catch(err => next(err))
      res.redirect(`/games/view?id=${game.insertId}`)
    }

    function complete(error) {
        res.render("games/new", { title: "New Game", games: true, error: error })
    }
})

router.get('/view', async function (req, res, nex) {
    //Number() converts req.query.id into a number because express returns all queries as strings
    if (isNaN(Number(req.query.id))) return res.status(404).render('404', { title: "404 Not Found" })
    const [game] = await connection.promise().query('SELECT * FROM games WHERE id = ? AND deleted = 0', req.query.id).catch(err => next(err))
    if (!game.length) return res.status(404).render('404', { title: "404 Not Found" })
    
    let serversArr = []
    const [servers] = await connection.promise().query('SELECT * FROM jobs WHERE game = ?', req.query.id).catch(err => next(err))

    for (var i = 0, len = servers.length; i < len; i++) {
      serversArr.push({name: servers[i].name, players: servers[i].players})
    }

    res.render("games/view", { title: "Games", fontAwesome: true, games: true, game: game[0], servers: serversArr })
})

router.get('/edit', utils.checkAuth, async function (req, res, next) {
    if (isNaN(Number(req.query.id))) return res.status(404).render('404', { title: "404 Not Found" })
    const [game] = await connection.promise().query('SELECT * FROM games WHERE id = ? AND deleted = 0', req.query.id).catch(err => next(err))
    if (!game.length) return res.status(404).render('404', { title: "404 Not Found" })
    if (game[0].creator !== req.user.id) return res.status(404).render('404', { title: "404 Not Found" })

    res.render("games/edit", { title: "Edit Game", games: true, game: game[0] })
})

router.post('/edit', utils.checkAuth, async function (req, res, next) {
    if (isNaN(Number(req.query.id))) return res.status(404).render('404', { title: "404 Not Found" })
    const [game] = await connection.promise().query('SELECT * FROM games WHERE id = ? AND deleted = 0', req.query.id).catch(err => next(err))
    if (!game.length) return res.status(404).render('404', { title: "404 Not Found" })
    if (game[0].creator !== req.user.id) return res.status(404).render('404', { title: "404 Not Found" })

    const name = req.body.name.trim()
    const description = req.body.description.trim()
    const maxplayers = req.body.maxplayers

    if (!name) {
      complete("The game name cannot be empty.")
    } else if (name.length > 20) {
      complete("The game name cannot be more than 20 characters.")
    } else if (description.length > 2000) {
      complete("The game name cannot be more than 2,000 characters.")
    } else if (!maxplayers) {
      complete("The max players cannot be empty.")
    } else if (isNaN(maxplayers)) {
      complete("The max players must be a number.")
    } else if (maxplayers > 200) {
      complete("The max players cannot be greater than 200.")
    } else {
      await connection.promise().query('UPDATE games SET name = ?, description = ?, modifiedon = ? WHERE id = ?', [name, description, Date.now(), req.query.id]).catch(err => next(err))
      const [game] = await connection.promise().query('SELECT * FROM games WHERE id = ? AND deleted = 0', req.query.id).catch(err => next(err))
      res.render("games/edit", { title: "New Game", games: true, success: "Edited!", game: game[0] })
    }

    function complete(error) {
        res.render("games/edit", { title: "New Game", games: true, error: error, game: game[0] })
    }
})

router.post('/announce', async function (req, res, next) {
  console.log(req.query)
  if (isNaN(Number(req.query.id))) return res.status(404).render('404', { title: "404 Not Found" })
  const [game] = await connection.promise().query('SELECT * FROM games WHERE id = ?', req.query.id).catch(err => next(err))
  if (!game.length) return res.status(400).json({"success": false, "reason": "Invalid game."})

  if (game[0].laststart > Date.now() - 5000) {
    res.status(400).json({"success": false})
  } else {
    await connection.promise().query('UPDATE games SET laststart = ? WHERE id = ?', [Date.now(), req.query.id]).catch(err => next(err))
    await connection.promise().query('INSERT INTO jobs SET name = ?, port = ?, game = ?, startedon = ?, version = ?, lastping = ?', [req.query.job, req.query.port, req.query.id, Date.now(), game[0].version, Date.now()]).catch(err => next(err))
    pingChecker(req.query.job, next, true)
    res.json({"success": true})
  }
})

router.get('/token', utils.checkAuth, async function (req, res, next) {
  let counter = 0
    
  async function checkServer() {
    counter += 1
    console.log(counter)
    if (counter >= 5) return res.json({"success": false, "reason": "Server did not start"})
    const [job] = await connection.promise().query('SELECT * FROM jobs WHERE game = ? AND deleted = 0', req.query.id).catch(err => next(err))
    if (job.length) {
      const url = encodeURIComponent(`https://ourblox.pw/game/join?ip=game.ourblox.pw&port=${job[0].port}&name=${req.user.username}&id=1&placeid=${req.query.id}&following=0&bc=OutrageousBuildersClub&age=0`)
      res.json({"success": true, "url": `ourbloxplay17:1+launchmode:play+gameinfo:"a"+placelauncherurl:${url}`})
    } else {
      await utils.sleep(2000)
      checkServer()
    }
  }

  if (isNaN(Number(req.query.id))) return res.status(404).render('404', { title: "404 Not Found" })
  const [game] = await connection.promise().query('SELECT * FROM games WHERE id = ? AND deleted = 0', req.query.id).catch(err => next(err))
  if (!game.length) return res.status(404).render('404', { title: "404 Not Found" })

  const [job] = await connection.promise().query('SELECT * FROM jobs WHERE game = ? AND deleted = 0', req.query.id).catch(err => next(err))
  const jobId = `ourblox-${utils.makeId(6)}-${req.query.id}`

  //delay to prevent server spamming
  if (!job.length && game[0].laststart > Date.now() - 5000) {
    checkServer()
  } else if (!job.length) {
    const newJob = `
    ${soap.body}
    <ns1:OpenJob>
    <ns1:job>
        <ns1:id>${jobId}</ns1:id>
        <ns1:expirationInSeconds>604800</ns1:expirationInSeconds>
    </ns1:job>
    <ns1:script>
        <ns1:name>Start Server</ns1:name>
        <ns1:script>loadstring(game:HttpGet("https://ourblox.pw/game/gameserver.ashx?data=${req.query.id};0;${jobId};http%3A%2F%2Fourblox.pw", true))()</ns1:script>
    </ns1:script>
    </ns1:OpenJob>
    ${soap.bodyEnd}`
    
    function checkStatus(res) {
      if (res.ok) { // res.status >= 200 && res.status < 300
          checkServer()
      } else {
          next("Gameserver returned error")
      }
    }

    fetch('http://192.168.1.224:64989', { method: 'POST', body: newJob })
    .then(checkStatus)
    .catch(err => next(err))
  } else {
    const url = encodeURIComponent(`https://ourblox.pw/game/join?ip=game.ourblox.pw&port=${job[0].port}&name=${req.user.username}&id=1&placeid=${req.query.id}&following=0&bc=OutrageousBuildersClub&age=0`)
    res.json({"success": true, "url": `ourbloxplay17:1+launchmode:play+gameinfo:"a"+placelauncherurl:${url}`})
  }
})

router.post('/ping', async function (req, res, next) {
  if (isNaN(Number(req.query.id))) return res.status(404).render('404', { title: "404 Not Found" })
  const [game] = await connection.promise().query('SELECT * FROM games WHERE id = ?', req.query.id).catch(err => next(err))
  if (!game.length) return res.status(400).json({"success": false, "reason": "Invalid game."})
  
  await connection.promise().query('UPDATE jobs SET players = ?, lastping = ? WHERE name = ?', [req.query.players, Date.now(), req.query.job]).catch(err => next(err))
  res.json({"success": true})
})

module.exports = router