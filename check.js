'use strict';

const START_DATE = new Date();
const END_DATE = new Date(START_DATE.getFullYear(),START_DATE.getMonth()+1,START_DATE.getDate()); // check for 1 month
const CHECK_DELAY_MSEC = 30000;
const SHOW_ZERO_SPACES = false;
const TIMEOUT = 60000;

/** --------------------------------------------------------------------------------------------------
* Take screen shot of the booking web site
*/

/*function webshot1(paramUrl,paramOutFilename,paramDelay,cb) {
	let webshot = require('webshot');

	const options = {
		windowSize: {width: 1024, height: 768},
		shotSize: {width: 'all', height: 'all'},
		renderDelay: paramDelay,
		timeout: 60000,
		errorIfStatusIsNot200: true
	}

	webshot(paramUrl,paramOutFilename,options,cb);
}
*/

class CheckTickets {

	constructor(inDate) {
		this.dateToCheck = new Date(inDate);
		this.dateToCheckStr = `${this.dateToCheck.getFullYear()}-${('0'+(this.dateToCheck.getMonth()+1)).substr(-2)}-${('0'+this.dateToCheck.getDate()).substr(-2)}`;
		this.result = {};
		this.resultMsg = '';
		//console.log('constructor: dateToCheck=',this.dateToCheckStr);
	}

	// @param ms : delay msec before checking ticket
	checkAfterMax(ms) {
		return new Promise((resolve,reject)=>{
			setTimeout(()=>
				{
					this.checkNow()
					.then((value)=>{
						resolve(value);
					})
					.catch((reason)=>{
						reject(reason);
					});
				},
				Math.floor(Math.random()*ms)
			); // setTimeout()
		}); // new Promise()
	};

	checkNow() {
		return new Promise((resolve,reject)=>{
			//console.log(`SkyGarden: checkNow: ${this.dateToCheckStr} ...`);

			const httpTimeoutDone = false;
			const httpTimeout=setTimeout(
				()=>{
					console.log(`SkyGarden: ${this.dateToCheckStr}: Error: HTTP request timeout.`);
					resolve(`SkyGarden: ${this.dateToCheckStr}: Error: HTTP request timeout.`);
				}, 
				TIMEOUT
				); // setTimeout()
			this.getStatus((err,result)=>{
				clearTimeout(httpTimeout);
				if (err) {
					console.log(`SkyGarden: ${this.dateToCheckStr}: HTTP Error: `,err);
					resolve(`SkyGarden: ${this.dateToCheckStr}: HTTP Error: ${JSON.stringify(err)}`);
				} else {
					this.result = result;
					// available
					let msg = '';
					for (let key in result.numFreeSpaces) {
						console.log(`** ${key}: ${result.numFreeSpaces[key]} spaces.\n`);
						msg += (`** ${key}: ${result.numFreeSpaces[key]} spaces.\n`);
					}
					this.resultMsg = msg;
					resolve(this);
				}
			}); // getStatus()
		});// new Promise()
	}

	/** -------------------------------------------------------------------------------------------------
	* getStatus: Get JSON of booking status
	* @param n/a
	* @callback - callback function to be called when data retrieved
	*/
	getStatus(callback) {
		// Request URL: https://skygarden.bookingbug.com/api/v1/37002/events?start_date=2017-08-08&end_date=2017-08-08
		let returnValue = {};
		const https = require('https');
		const options = {
			host: 'skygarden.bookingbug.com',
			path: `/api/v1/37002/events?start_date=${this.dateToCheckStr}&end_date=${this.dateToCheckStr}`,
			headers: {
				'App-Id': 'f6b16c23', 
				'App-Key': 'f0bc4f65f4fbfe7b4b3b7264b655f5eb',
				'Accept': 'application/hal+json, application/json',
				'Host': 'skygarden.bookingbug.com',
				'Origin': 'https://bespoke.bookingbug.com',
				'Referer': 'https://bespoke.bookingbug.com/skygarden/new_booking.html'
			}
		}
		https.get(options, (res)=>{
			let resdata='';
			res.on('data',(chunk)=>{
				resdata+=chunk;
			})
			res.on('end',()=>{
				resdata=JSON.parse(resdata);
				//console.log('getStatus: resdata',JSON.stringify(resdata));
				returnValue.resData = resdata;
				returnValue.numFreeSpaces = [];
				if (resdata.total_entries > 0) {
					try{
						for (let thisEventKey in resdata._embedded.events) {
							const thisEvent = resdata._embedded.events[thisEventKey];
							const eventDateTime = thisEvent.datetime;

							let eventFreeSpaces = 0;
							let prevTicketKey=999999;
							for (let thisTicketKey in thisEvent['ticket_spaces']) {
								if (prevTicketKey*1 > thisTicketKey*1) { // only get smaller one
									prevTicketKey = thisTicketKey;
									eventFreeSpaces = thisEvent['ticket_spaces'][thisTicketKey].left;
								}
							}

							if (SHOW_ZERO_SPACES || eventFreeSpaces>0) {
								console.log(`getStatus(): ${eventDateTime} : ${eventFreeSpaces}`);
								returnValue.numFreeSpaces[eventDateTime]=eventFreeSpaces;
							}
						}
					} catch(e) {
						console.log('getStatus() numFreeSpaces cannot be retrieved',e);
					}
				}
				callback(null,returnValue);
			})
			res.on('error',(err)=>{
				callback(err,null);
			})
		});
	}

};

// Send message to Telegram: "https://api.telegram.org/<bot_id>:<api_token>/sendMessage?chat_id=@<channel_name>&text=" & $msg
function sendMsg(msg) {
	const https = require('https');
	const options = {
		host: 'api.telegram.org',
		path: `/<bot_id>:<api_token>/sendMessage?chat_id=@<channel_name>&text=${encodeURI(msg)}`,
		headers: {
		}
	}
	https.get(options, (res)=>{
		res.on('error',()=>{
			console.log('SkyGarden: sendMsg(): error:',res);
		});
	});
}


/** ----------------------------------------------------------------------------------------------------
* Main
*/

/*
const now = new Date(); // for output filename format
webshot1(
	'http://skygarden.london/booking',
	`./webshot_output/skygarden-${now.getFullYear()}-${('0'+(now.getMonth()+1)).slice(-2)}-${('0'+now.getDate()).slice(-2)}-${('0'+now.getHours()).slice(-2)}${('0'+now.getMinutes()).slice(-2)}${('0'+now.getSeconds()).slice(-2)}.png`,
	5000,
	(err)=>{
				if (err) {
					// write error
					console.log(`${new Date()} - Webshot error`);
				} else {
					// write done
					console.log(`${new Date()} - Webshot success`);
				}
			}
	);
*/

console.log('SkyGarden: start checking...');
//sendMsg('SkyGarden: start checking...');

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
		for (let k in values) {''
			//console.log('Result:', (values[k] instanceof CheckTickets)? 'result: '+values[k].resultMsg : 'error: '+values[k]);
			if (values[k] instanceof CheckTickets && values[k].resultMsg!=='') {
				sendMsg(values[k].resultMsg);
			} else if (values[k].constructor===String) sendMsg(values[k]);
		}
	}) // Promise.all(allCheckPromises).then()
	.catch((reason)=>{
		console.log('Some checks failed:',reason)
		sendMsg(`Error in checking tickets: ${reason}`);
	}) // Promise.all(allCheckPromises).catch()
;

