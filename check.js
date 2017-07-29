'use strict';

//-- settings ----------------------------------------------------------------------------------------
const START_DATE = new Date();
const END_DATE = '2017-12-31';
const CHECK_DELAY_MSEC = 30000;
const SHOW_ZERO_SPACES = false;


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
					resolve(`SkyGarden: ${this.dateToCheckStr}: Error: HTTP request timeout.`); // i don't want to reject() as i still want to show other results
				}, 
				10000
				); // setTimeout()
			this.getStatus((err,result)=>{
				clearTimeout(httpTimeout);
				if (err) {
					console.log(`SkyGarden: ${this.dateToCheckStr}: HTTP Error: `,err);
					resolve(`SkyGarden: ${this.dateToCheckStr}: HTTP Error: ${JSON.stringify(err)}`);
				} else {
					this.result = result;
					if (result.numSlots*1 > 0) {
						// available
						console.log(`SkyGarden: ${this.dateToCheckStr} *Slot available*: (${result.numSlots}). !!!!!!!!!!!!!!!!!!`);
						let msg = '';
						for (let key in result.numFreeSpaces) {
							if (msg=='') msg=`SkyGarden: ${this.dateToCheckStr}: ${result.numSlots} slots:\n`;
							msg += (`--  ${key.split('T')[1]}: ${result.numFreeSpaces[key]} spaces.\n`);
						}
						this.resultMsg = msg;
					} else if (result.numSlots*1 != 0) {
						console.log(`SkyGarden: ${this.dateToCheckStr} unexpected result.numSlots: (${result.numSlots}).`);			
						resolve(`${this.dateToCheckStr} unexpected result: num of slots=${result.numSlots}.`);
					}
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
		//console.log('SkyGarden: getStatus(): path:',`/api/v1/37002/event_chains?start_date=${inDate}&end_date=${inDate}`)
		let returnValue = {};
		const https = require('https');
		const options = {
			host: 'skygarden.bookingbug.com',
			path: `/api/v1/37002/event_chains?start_date=${this.dateToCheckStr}&end_date=${this.dateToCheckStr}`,
			headers: {
				'App-Id': 'f6b16c23', 
				'App-Key': 'f0bc4f65f4fbfe7b4b3b7264b655f5eb',
				'Accept': 'application/hal+json, application/json',
				'Host': 'skygarden.bookingbug.com',
				'Origin': 'https://bespoke.bookingbug.com',
				'Referer': 'https://bespoke.bookingbug.com/skygarden/new_booking.html'
			} // get it from the Sky Garden official web site
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
				returnValue.numSlots = resdata.total_entries;
				returnValue.numFreeSpaces = [];
				returnValue.numTicketSpaces = [];
				if (resdata.total_entries > 1) {
					try{
						for (let thisEventKey in resdata._embedded.event_chains) {
							const thisEvent = resdata._embedded.event_chains[thisEventKey];

							const eventDate = thisEvent.start_date;
							const eventTime = thisEvent.time.split('T')[1];
							const eventSpaces = thisEvent.spaces;

							if (SHOW_ZERO_SPACES || eventSpaces>0) {
								for (let thisTicketKey in thisEvent._embedded.ticket_sets) {
									const thisTicket = thisEvent._embedded.ticket_sets[thisTicketKey];

									if (thisTicket.name=='Adult' && thisTicket.pool_name=='Admittance') {
										console.log('getStatus(): start_date=',eventDate,'time=',eventTime,'ticket spaces=',thisTicket.spaces);
										// only return result if it is adult admittance ticket
										returnValue.numFreeSpaces[eventDate+'T'+eventTime] = eventSpaces;
										returnValue.numTicketSpaces[eventDate+'T'+eventTime] = thisTicket.spaces;
									}
								}
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

// Send message to Telegram: "https://api.telegram.org/<bot_id>:<api_key>/sendMessage?chat_id=@<channel_name>&text=" & $msg
function sendMsg(msg) {
	const https = require('https');
	const options = {
		host: 'api.telegram.org',
		path: `/<bot_id>:<api_key>/sendMessage?chat_id=@<channel_name>&text=${encodeURI(msg)}`,
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
			console.log('Result:', (values[k] instanceof CheckTickets)? 'result: '+values[k].resultMsg : 'error: '+values[k]);
			if (values[k] instanceof CheckTickets && values[k].resultMsg!='') sendMsg(values[k].resultMsg);
			else if (values[k].constructor===String) sendMsg(values[k]);
		}
	}) // Promise.all(allCheckPromises).then()
	.catch((reason)=>{
		console.log('Some checks failed:',reason)
		sendMsg(`Error in checking tickets: ${reason}`);
	}) // Promise.all(allCheckPromises).catch()
;

