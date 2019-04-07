/* Copyright 2019 Ourblox, All Rights Reserved */

var utils = require('./utils');
var jobHandler = require('./job-handler.js');
var connection = utils.connection;
var exports = module.exports = {};

exports.closeJob = function(id, dead, next) {
    return await connection.promise().query('UPDATE jobs SET deleted = 1 WHERE name = ?', id).catch(err => next(err));
};

exports.fetchJobs = function(next) {
    return await connection.promise().query('SELECT * FROM jobs WHERE name = ? AND deleted = 0', id).catch(err => next(err));
}

exports.fetchJobsByGame = function(next, game) {
    return await connection.promise().query('SELECT * FROM jobs WHERE game = ?', game).catch(err => next(err));
}

exports.fetchJobsByGameAndExists = function(next, game) {
    return await connection.promise().query('SELECT * FROM jobs WHERE game = ? AND deleted = 0', game).catch(err => next(err));
}

exports.fetchGamesByCreator = function(next, creator) {
    return await connection.promise().query('SELECT * FROM games WHERE creator = ?', creator).catch(err => next(err));
}

exports.fetchGamesByIdAndExists = function(next, id) {
    return await connection.promise().query('SELECT * FROM games WHERE id = ? AND deleted = 0', id).catch(err => next(err));
}

exports.fetchGames = function(next, creator) {
    return await connection.promise().query('SELECT * FROM games').catch(err => next(err));
}

exports.createGame = function(next, name, id, description) {
    return await connection.promise().query('INSERT into games SET name = ?, creator = ?, description = ?, createdon = ?, modifiedon = ?', [name, id, description, Date.now(), Date.now()]).catch(err => next(err));
}

exports.editGame = function(next, name, id, description) {
    return await connection.promise().query('UPDATE games SET name = ?, description = ?, modifiedon = ? WHERE id = ?', [name, description, Date.now(), id]).catch(err => next(err));
}

exports.updateGameJobStart = function(next, id) {
    return await connection.promise().query('UPDATE games SET laststart = ? WHERE id = ?', [Date.now, id]).catch(err => next(err));
}

exports.createJob = function(next, job, port, id, version) {
    return await connection.promise().query('INSERT INTO jobs SET name = ?, port = ?, game = ?, startedon = ?, version = ?, lastping = ?', [job, port, id, Date.now(), version, Date.now()]).catch(err => next(err));
}

exports.updateJob = function(next, players, job) {
    return await connection.promise().query('UPDATE jobs SET players = ?, lastping = ? WHERE name = ?', [players, Date.now(), job]).catch(err => next(err));
}