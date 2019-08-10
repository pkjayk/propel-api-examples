const express = require('express')
const app = express()
const port = 3000

const Import = require('./Import')

app.get('/', (req, res) => res.send('CAD Gateway Running!'))

app.get('/import', function (req, res) {
  new Import(req, res)
})

app.listen(port, () => console.log(`CAD Gateway is active on ${port}!`))