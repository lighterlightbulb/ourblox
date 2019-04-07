/* Copyright 2019 Ourblox, All Rights Reserved */

var express = require('express');
var utils = require('../utils');
var database = require('../database');
var jobHandler = require('../job-handler');

var router = express.Router();

async function pingChecker(id, next, firstRun) {
    if (!firstRun) {
        const [job] = database.fetchJobs();
        let result = true;
        
        if (job[0].lastping < Date.now() - 5000 || job[0].players === 0) {
            database.closeJob(id);
            if (job[0].lastping < Date.now() - 5000) {
                jobHandler.closeJob(id);
            }
        }

        if (!result) {
            next('Gameserver returned error');
        }
    }
    else {
        setTimeout(function() { pingChecker(id, next) }, 40000);
    }
};

function validateGameInput(body) {
    const name = body.name.trim();
    const description = body.description.trim();
    const maxplayers = body.maxplayers;

    if (!name) { return 'The game name cannot be empty.';  }
    else if (name.length > 20) { return 'The game name cannot be more than 20 characters.' }
    else if (description.length > 2000) { return 'The game name cannot be more than 2,000 characters.' }
    else if (!maxplayers) { return 'The max players cannot be empty.' }
    else if (isNaN(maxplayers)) { return 'The max players must be a number.' }
    else if (maxplayers > 200) { return 'The max players cannot be greater than 200.' }

    return {
        success: true,
        name: name,
        description: description,
        maxplayers: maxplayers
    }
}

function validateQuery(req, next) {
    if (isNaN(Number(req.query.id))) return false; // Number() converts req.query.id into a number because express returns all queries as strings
    
    const [game] = database.fetchGamesByIdAndExists(next, req.query.id);
    if (!game.length) return false;

    return game;
}

router.get('/', async function (req, res, next) {
    res.render('games/main', { title: 'Games', fontAwesome: true, games: true, results: database.fetchGames(next) });
});

router.get('/my', async function (req, res, next) {
    res.render('games/main', { title: 'Games', fontAwesome: true, games: true, results: database.fetchGames(next, req.user.id) });
});

router.get('/new', utils.checkAuth, function (req, res) {
    res.render('games/new', { title: 'New Game', games: true });
});

router.post('/new', utils.checkAuth, async function (req, res, next) {
    var result = validateGameInput(req.body);

    if (!result.success) {
        return res.render('games/new', { title: 'New Game', games: true, error: result });
    }

    const [game] = database.createGame(next, result.name, req.user.id, result.description);
    res.redirect(`/games/view?id=${game.insertId}`);
});

router.get('/view', async function (req, res, nex) {
    const result = validateQuery(req, next);
    if (result === false) return make404(res);

    res.render('games/view', { title: 'Games', fontAwesome: true, games: true, game: result, servers: database.fetchJobsByGame(next, req.query.id); })
})

router.get('/edit', utils.checkAuth, async function (req, res, next) {
    const result = validateQuery(req, next);
    if (result === false) return make404(res);
    if (result[0].creator !== req.user.id) return make404(res);

    res.render('games/edit', { title: 'Edit Game', games: true, game: result[0] })
})

router.post('/edit', utils.checkAuth, async function (req, res, next) {
    var result = validateQuery(req, next);
    var input = validateGameInput(req.body);

    if (result === false) return make404(res);
    if (result[0].creator !== req.user.id) return make404(res);
    if (!input.success) return res.render('games/new', { title: 'New Game', games: true, error: result });

    database.editGame(input.name, input.description, req.query.id);
    
    const [game] = database.fetchGamesByIdAndExists(next, req.query.id);
    res.render('games/edit', { title: 'New Game', games: true, success: 'Edited!', game: game[0] })
});

router.post('/announce', async function (req, res, next) { // TODO: Move this to API server? (api.ourblox.pw)
    var result = validateQuery(req, next);
    if (result === false) return res.status(400).json({'success': false, 'reason': 'Invalid game.'});

    if (result[0].laststart > Date.now() - 5000) {
        return res.status(400).json({'success': false});
    }

    database.updateGameJobStart(next, req.query.id);
    database.createJob(next, req.query.job, req.query.port, req.query.id, result[0].version);

    pingChecker(req.query.job, next, true);
    res.json({'success': true});
});

router.get('/token', utils.checkAuth, async function (req, res, next) {
    let counter = 0;
    
    async function checkServer() {
        counter += 1;
        if (counter >= 5) return res.json({'success': false, 'reason': 'Server did not start'});
        
        const [job] = await connection.promise().query('SELECT * FROM jobs WHERE game = ? AND deleted = 0', req.query.id).catch(err => next(err))
        if (job.length) {
            const url = encodeURIComponent(`https://ourblox.pw/game/join?ip=game.ourblox.pw&port=${job[0].port}&name=${req.user.username}&id=1&placeid=${req.query.id}&following=0&bc=OutrageousBuildersClub&age=0`)
            res.json({'success': true, 'url': `ourbloxplay17:1+launchmode:play+gameinfo:'${job[0].name}'+placelauncherurl:${url}`})
        } else {
            await utils.sleep(2000);
            checkServer();
        }
    }

    const result = validateQuery(req, next);
    if (result === false) return make404(res);

    const [job] = database.fetchJobsByGameAndExists(next, req.query.id);
    const jobId = `ourblox-${utils.makeId(6)}-${req.query.id}`;

    // Delay to prevent server spamming
    if (!job.length && result[0].laststart > Date.now() - 5000) {
        checkServer();
    }
    else if (!job.length) {
        var result = jobHandler.openJob(next, 604800, req.query.id, jobId);

        if (!result) {
            next('Gameserver returned error');
        }
    }
  else {
    const url = encodeURIComponent(`https://ourblox.pw/game/join?ip=game.ourblox.pw&port=${job[0].port}&name=${req.user.username}&id=1&placeid=${req.query.id}&following=0&bc=OutrageousBuildersClub&age=0`);
    res.json({'success': true, 'url': `ourbloxplay17:1+launchmode:play+gameinfo:'${job[0].name}'+placelauncherurl:${url}`});
  }
})

router.post('/ping', async function (req, res, next) {
    var result = validateQuery(req, next);
    if (result === false) return res.status(400).json({'success': false, 'reason': 'Invalid game.'});

    database.updateJob(req.query.players, req.query.job);
    res.json({'success': true});
});

module.exports = router;