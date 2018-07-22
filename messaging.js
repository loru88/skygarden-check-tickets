var FBMessenger = require('fb-messenger');
var messenger = new FBMessenger(process.env.FB_PAGE_TOKEN, "REGULAR");

/** ----------------------------------------------------------------------------------------------------
 * Send message to Telegram: "https://api.telegram.org/<bot_id>:<api_token>/sendMessage?chat_id=@<channel_name>&text=" & $msg
 */
function sendTelegram(msg) {
    const https = require('https');
    const options = {
        host: 'api.telegram.org',
        path: `/<bot_id>:<api_token>/sendMessage?chat_id=@<channel_name>&text=${encodeURI(msg)}`,
        headers: {
        }
    };
    https.get(options, (res)=>{
        res.on('error',()=>{
            console.log('SkyGarden: sendMsg(): error:',res);
        });
    });
}

/** ----------------------------------------------------------------------------------------------------
 * Send message to Telegram: "https://api.telegram.org/<bot_id>:<api_token>/sendMessage?chat_id=@<channel_name>&text=" & $msg
 */
var sendFb = function(msg) {
    messenger.sendTextMessage(process.env.FB_RECIPIENT, msg);
};

var sendFbButton = function(msg) {

    messenger.sendButtonsMessage(process.env.FB_RECIPIENT, msg, [
        {
            "type": "web_url",
            "url": "https://skygarden.london/booking",
            "title": "book now!"
        }
    ] )
}

exports.sendFb = sendFb;
exports.sendFbButton = sendFbButton;