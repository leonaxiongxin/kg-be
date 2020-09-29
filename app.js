const express = require('express')
const winston = require('winston')
var path = require('path')

const app = express()

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

require('./startup/logging')()
require('./startup/routes')(app)
require('./startup/config')()

const port = 7000
const server = app.listen(port, () => winston.info(`Listening on port ${port}...`))
module.exports = server
