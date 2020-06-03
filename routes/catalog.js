/*
    Ourblox Website
    Made by 1002, lightbulblighter
    Contact: ozzt@shit.software, lightbulblighter@gmail.com

    MIT Licensed
	A copy of the MIT license is available in the "LICENSE" file.
*/

const express = require('express')
const router = express.Router()
const utils = require('../utils')
const database = require('../database')
const fs = require('fs')

const multiparty = require('connect-multiparty')
const multipart = multiparty()

const mmm = require('mmmagic')
const Magic = mmm.Magic
const bluebird = require("bluebird")

bluebird.promisifyAll(Magic.prototype)

async function validateItemInput(name, description, price, type, file, creation) {
    const allowedTypes = ["shirt", "pants", "tshirt", "decal", "audio", "model", "face"]
    const allowedFileTypes = ["image/png", "image/jpeg"]
    const magic = new Magic(mmm.MAGIC_MIME_TYPE)
    
    if (!name) { return 'The item name cannot be empty.';  }
    else if (name.length > 20) { return 'The item name cannot be more than 20 characters.' }
    else if (description && description.length > 2000) { return 'The item description cannot be more than 2,000 characters.' }
    else if (!price) { return 'The price cannot be empty.' }
    else if (isNaN(price)) { return 'The price must be a number.' }
    else if (price > 2147483647) { return 'The price cannot be greater than 2147483647.' }
    else if (!type && creation) { return 'The type cannot be empty.' }
    else if (!allowedTypes.includes(type) && creation) { return 'Invalid type.' }
    else if (!file || file.size === 0 && creation) { return 'The file cannot be empty.' }

    const fileType = await magic.detectFileAsync(file.path)
    if (!allowedFileTypes.includes(fileType)) { return 'Invalid file type.' }
    
    return true
}

router.get('/', async function (req, res, next) {
    const items = await database.fetchAllItems(next)

    for (let i = 0, len = items.length; i < len; i++) {
        items[i].creatorName = await database.resolveName(next, items[i].creator) 
    }

    res.render('catalog/main', { title: 'Catalog', catalog: true, items: items })
})

router.get('/view', async function (req, res, next) {
    if (!req.query.id || isNaN(Number(req.query.id))) return utils.make404(res)
    const item = await database.fetchItem(next, req.query.id)
    if (!item.length) return utils.make404(res)

    item[0].creatorName = await database.resolveName(next, item[0].creator) 

    res.render('catalog/view', { title: 'Viewing Item', catalog: true, item: item[0] })
})

router.get('/create', utils.checkAuth, function (req, res, next) {
    res.render('catalog/create', { title: 'New Item', catalog: true })
})

router.post('/create', utils.checkAuth, multipart, async function (req, res, next) {
    const name = req.body.name
    const description = req.body.description
    const price = Number(req.body.price)
    const type = req.body.type.toLowerCase()
    let offsale
    
    const result = await validateItemInput(name, description, price, type, req.files.file, true)

    if (result !== true) {
        return res.render('catalog/create', { title: 'New Item', catalog: true, error: result })
    }

    if (req.body.offsale) { offsale = 1 } else { offsale = 0 }
    
    const item = await database.createItem(next, name, description, req.session.id, type, null, 0, price, offsale)

    fs.rename(req.files.file.path, `assets/${item.insertId}`, async function (err) {
        if (err) throw err
        if (type !== 'face' && type !== 'decal') {
            console.log(type)
            await database.insertQueue(next, null, item.insertId, type)
        }
        res.redirect(`/catalog/view?id=${item.insertId}`)
    })
})

module.exports = router