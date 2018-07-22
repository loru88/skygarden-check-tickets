'use strict';

require('dotenv').config();
const CheckTickets = require('./check.js');
var msg = require('./messaging');

const START_DATE = new Date();
const END_DATE = new Date(START_DATE.getFullYear(),START_DATE.getMonth()+1,START_DATE.getDate()); // check for 1 month
const CHECK_DELAY_MSEC = 30000;



console.log('SkyGarden: start checking...');
msg.sendFb('SkyGarden: start checking...');

// create promise for each check, and wait for all promises are success, then sort the results by date and send the results
var allCheckPromises = [];

// Convert curCheckDate to value before passing to function (to make it as pass-by-value)
//   Reference: variable scope inside loop: https://stackoverflow.com/questions/750486/javascript-closure-inside-loops-simple-practical-example
for (let curCheckDate = new Date(START_DATE); curCheckDate < new Date(END_DATE); curCheckDate.setDate(curCheckDate.getDate()+1)) {
    let c = new CheckTickets(curCheckDate.toString());
    allCheckPromises.push( c.checkAfterMax(CHECK_DELAY_MSEC) ); // return a promise with the CheckTickets object as the result
}

//console.log('All promises',allCheckPromises);
Promise.all(allCheckPromises)
    .then((values)=>{
        console.log('All checks finished');
        for (let k in values) {
            //console.log('Result:', (values[k] instanceof CheckTickets)? 'result: '+values[k].resultMsg : 'error: '+values[k]);
            if (values[k] instanceof CheckTickets && values[k].resultMsg!=='') {
                msg.sendFb(values[k].resultMsg);
            } else if (values[k].constructor===String) msg.sendFb(values[k]);
        }
    }) // Promise.all(allCheckPromises).then()
    .catch((reason)=>{
        console.log('Some checks failed:',reason)
        msg.sendFb(`Error in checking tickets: ${reason}`);
    }) // Promise.all(allCheckPromises).catch()
;
