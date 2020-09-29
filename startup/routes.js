const express = require('express')
const index = require('../routes/index')
const chronology = require('../routes/chronology')
const error = require('../middleware/error')

module.exports = function(app) {
    app.use(express.json())
    app.use('/', index)
    app.use('/chronology', chronology)
    app.use(error)
}
