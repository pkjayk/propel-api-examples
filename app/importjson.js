// Propel Import API
// load items from JSON file into propel using API

const config = require('../config') // username and password stored here
// ./config.js
// module.exports = {
//   username : 'jayson@username.dev',
//   password : 'yourpass_and_token', //must include password+token
//   loginUrl : 'https://login.salesforce.com'
// };

const fs = require('fs')
const jsforce = require('jsforce')        // https://www.npmjs.com/package/jsforce  and see docs: https://jsforce.github.io/
const { parse } = require('json2csv')
const conn = new jsforce.Connection({ loginUrl : config.loginUrl})
let namespace = config.namespace || 'PDLM';

//
// the file try.csv contains a valid CSV import file for your org
// you must import a file using the Propel application one time to establish the column mappings
// after that, this api will re-use those stored column to field mappings
//
let dataFile = require('../test_data/sample-bom-large.json');

let items = dataFile.bomTable.items;

// todo, make call to grab top-level assembly
var firstItem = {Level: 0, Category: 'Assembly', 'Item Number': null, Quantity: '1'}
var reformattedItems = [firstItem];

// iterate through BOM and grab relevant fields.
// TODO: Create mapping for fields to import
// currently hardcoding category — can be input in file instead.
for (i = 0; i < items.length; i++) {
  
  let item = items[i];

  let level = items[i].item.replace(/\./g,'');

  var thisItem = {};

  // TODO: Level only converts if each level has < 10 items. If >10, need to check # of decimals and subtract from length

  thisItem = {Level: level.length, Category: 'Part', 'Item Number': item['partNumber'] ? item['partNumber'] : null, Quantity: item['quantity']}

  reformattedItems.push(thisItem);

}

const fields = ['Level','Category','Item Number','Quantity'];
const opts = { fields };
 
try {
  const csv = parse(reformattedItems, opts);
  const base64data = new Buffer(csv).toString('base64');

  conn.login(config.username, config.password)
  .then( () => {
    return conn.apex.post('/services/apexrest/'+namespace+'/api/v2/import?isReplacingBOM=true', base64data);
  })
  .then( (resultRows) => {
    console.log("Propel Item and Revision imported: ", resultRows);
    // the response is list of Apex.RowResult
    // [{ warning: '',
    //   success: true,
    //   rowName: '20-00362:A*',
    //   objName: 'Item Revision',
    //   isInsert: false,
    //   id: 'a0936000009c7OaAAI',
    //   errors: [],
    //   description: '' }]
  })

.catch((e)=>{ console.log(e) });} catch (err) {
  console.error(err);
}



