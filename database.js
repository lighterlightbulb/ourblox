/* Copyright 2019 Ourblox, All Rights Reserved */

var utils = require('./utils');
var jobHandler = require('./job-handler.js');
var connection = utils.connection;
var exports = module.exports = {};

exports.closeJob = async function(id, dead, next) {
    const [results] = await connection.promise().query('UPDATE jobs SET deleted = 1 WHERE name = ?', id).catch(err => next(err));
    return results
};

exports.fetchJobs = async function(next) {
    const [results] = await connection.promise().query('SELECT * FROM jobs WHERE name = ? AND deleted = 0', id).catch(err => next(err));
    return results
}

exports.fetchJobsByGame = async function(next, game) {
    const [results] = await  connection.promise().query('SELECT * FROM jobs WHERE game = ?', game).catch(err => next(err));
    return results
}

exports.fetchJobsByGameAndExists = async function(next, game) {
    const [results] = await connection.promise().query('SELECT * FROM jobs WHERE game = ? AND deleted = 0', game).catch(err => next(err));
    return results
}

exports.fetchGamesByCreator = async function(next, creator) {
    const [results] = await connection.promise().query('SELECT * FROM games WHERE creator = ?', creator).catch(err => next(err));
    return results
}

exports.fetchGameByIdAndExists = async function(next, id) {
    const [results] = await connection.promise().query('SELECT * FROM games WHERE id = ? AND deleted = 0', id).catch(err => next(err));
    return results
}

exports.fetchGames = async function(next) {
    const [results] = await connection.promise().query('SELECT * FROM games').catch(err => next(err));
    return results
}

exports.createGame = async function(next, name, id, description) {
    const [results] = await connection.promise().query('INSERT into games SET name = ?, creator = ?, description = ?, createdon = ?, modifiedon = ?', [name, id, description, Date.now(), Date.now()]).catch(err => next(err));
    return results
}

exports.editGame = async function(next, name, id, description) {
    const [results] = await connection.promise().query('UPDATE games SET name = ?, description = ?, modifiedon = ? WHERE id = ?', [name, description, Date.now(), id]).catch(err => next(err));
    return results
}

exports.updateGameJobStart = async function(next, id) {
    const [results] = await connection.promise().query('UPDATE games SET laststart = ? WHERE id = ?', [Date.now(), id]).catch(err => next(err));
    return results
}

exports.createJob = async function(next, job, port, id, version) {
    const [results] = await connection.promise().query('INSERT INTO jobs SET name = ?, port = ?, game = ?, startedon = ?, version = ?, lastping = ?', [job, port, id, Date.now(), version, Date.now()]).catch(err => next(err));
    return results
}

exports.updateJob = async function(next, players, job) {
    const [results] = await connection.promise().query('UPDATE jobs SET players = ?, lastping = ? WHERE name = ?', [players, Date.now(), job]).catch(err => next(err));
    return results
}