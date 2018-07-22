const SHOW_ZERO_SPACES = false;
const TIMEOUT = 60000;

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
				'App-Id': process.env.BOOKING_APP_ID,
				'App-Key': process.env.BOOKING_APP_KEY,
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

module.exports = CheckTickets;
