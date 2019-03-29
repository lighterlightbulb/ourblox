var express = require('express')
var router = express.Router()
var utils = require('../utils')

var connection = utils.connection

router.get('/', async function (req, res) {
    let gamesArr = []
    const [games] = await connection.promise().query('SELECT * FROM games')

    for (var i = 0, len = games.length; i < len; i++) {
      gamesArr.push({id: games[i].id, name: games[i].name, creator: games[i].creator})
    }

    res.render("games/main", { title: "Games", fontAwesome: true, games: true, results: gamesArr })
})

router.get('/my', async function (req, res) {
    let gamesArr = []
    const [games] = await connection.promise().query('SELECT * FROM games WHERE creator = ?', req.user.id)

    for (var i = 0, len = games.length; i < len; i++) {
      gamesArr.push({id: games[i].id, name: games[i].name, creator: games[i].creator})
    }

    res.render("games/main", { title: "Games", fontAwesome: true, games: true, results: gamesArr })
})

router.get('/new', utils.checkAuth, function (req, res) {
    res.render("games/new", { title: "New Game", games: true })
})

router.post('/new', utils.checkAuth, async function (req, res) {
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
      const [game] = await connection.promise().query('INSERT into games SET name = ?, creator = ?, description = ?, createdon = ?, modifiedon = ?', [name, req.user.id, description, Date.now(), Date.now()])
      res.redirect(`/games/view?id=${game.insertId}`)
    }

    function complete(error) {
        res.render("games/new", { title: "New Game", games: true, error: error })
    }
})

router.get('/view', async function (req, res) {
    //Number() converts req.query.id into a number because express returns all queries as strings
    if (isNaN(Number(req.query.id))) return res.status(404).render('404', { title: "404 Not Found" })
    const [game] = await connection.promise().query('SELECT * FROM games WHERE id = ? AND deleted = 0', req.query.id)
    if (!game.length) return res.status(404).render('404', { title: "404 Not Found" })
    
    res.render("games/view", { title: "Games", fontAwesome: true, games: true, game: game[0] })
})

router.get('/edit', utils.checkAuth, async function (req, res) {
    if (isNaN(Number(req.query.id))) return res.status(404).render('404', { title: "404 Not Found" })
    const [game] = await connection.promise().query('SELECT * FROM games WHERE id = ? AND deleted = 0', req.query.id)
    if (!game.length) return res.status(404).render('404', { title: "404 Not Found" })
    if (game[0].creator !== req.user.id) return res.status(404).render('404', { title: "404 Not Found" })

    res.render("games/edit", { title: "Edit Game", games: true, game: game[0] })
})

router.post('/edit', utils.checkAuth, async function (req, res) {
    if (isNaN(Number(req.query.id))) return res.status(404).render('404', { title: "404 Not Found" })
    const [game] = await connection.promise().query('SELECT * FROM games WHERE id = ? AND deleted = 0', req.query.id)
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
      await connection.promise().query('UPDATE games SET name = ?, description = ?, modifiedon = ? WHERE id = ?', [name, description, Date.now(), req.query.id])
      const [game] = await connection.promise().query('SELECT * FROM games WHERE id = ? AND deleted = 0', req.query.id)
      res.render("games/edit", { title: "New Game", games: true, success: "Edited!", game: game[0] })
    }

    function complete(error) {
        res.render("games/edit", { title: "New Game", games: true, error: error, game: game[0] })
    }
})

module.exports = router