# skygarden-check-tickets
A simple script to send message when free ticket for the Sky Garden, London is available

## Get started
1. Install Node.js if you don't have it
2. Download the source files to a folder
3. Run it:
```bash
cd /your/folder/path
node check.js
```

## Settings
You can adjust the setting at the top of the `check.js`:
```javascript
//-- settings ----------------------------------------------------------------------------------------
const START_DATE = new Date();
const END_DATE = '2017-12-31';
const CHECK_DELAY_MSEC = 30000;
const SHOW_ZERO_SPACES = false;
```

## Tips
* You might want to schedule this to be run daily to check the ticket availability automatically.  You may create a cron job or windows scheduled task to run it every half hour.
