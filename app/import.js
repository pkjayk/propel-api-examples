// Propel Import API
// load items from CSV file into propel using API

const config = require('../config') // username and password stored here
// ./config.js
// module.exports = {
//   username : 'ron@username.dev',
//   password : 'yourpass_and_token', //must include password+token
//   loginUrl : 'https://login.salesforce.com'
// };

const fs = require('fs')
const jsforce = require('jsforce')        // https://www.npmjs.com/package/jsforce  and see docs: https://jsforce.github.io/
const conn = new jsforce.Connection({ loginUrl : config.loginUrl})
let namespace = config.namespace || 'PDLM';

//
// the file try.csv contains a valid CSV import file for your org
// you must import a file using the Propel application one time to establish the column mappings
// after that, this api will re-use those stored column to field mappings
//
const filedata = fs.readFileSync('../test_data/new-bom-import.csv', 'utf8');
const base64data = new Buffer(filedata).toString('base64');
conn.login(config.username, config.password)
.then( () => {
  /*
     invoke the Propel API passing in the body base64 encoded

     @apiParam [hasItem=true] indicates the file contains items
     @apiParam [hasBom=true] indicates the file contains a BOM to import
     @apiParam [hasAML=false] indicates the file contains Mfr parts to import
     @apiParam [hasATT=false] indicates the file contains attachments to import
     @apiParam [matchDescription=false] indicates the file contains items with no item number and descriptions should be used to locate items
     @apiParam [isUpsertingItem=true] specify that the items in the file should overwrite items in the database if item number matches
     @apiParam [isUpsertingBOM=true] specify that the BOM in the file should overwrite BOM in the database if item number matches
     @apiParam [isReplacingBOM=false] specify that the BOM in the file should delete the BOM in the database if item number matches
     @apiParam [isUpsertingAML=false] specify that the AML in the file should overwrite AML in the database if item number matches
     @apiParam [isReplacingAML=false] specify that the AML in the file should delete the AML in the database if item number matches

  */
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
.catch((e)=>{ console.log(e) });
