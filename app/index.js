const express = require('express')
const app = express()
const port = 3000

const Import = require('./Import')

app.get('/', (req, res) => res.send('CAD Gateway Running!'))

app.get('/import', async function (req, res) {
	var contactImport = new Import(req, res)
	res.status(200)
	res.json(await contactImport.importData())
})

app.listen(port, () => console.log(`CAD Gateway is active on ${port}!`))