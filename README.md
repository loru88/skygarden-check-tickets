# skygarden-check-tickets
A simple script to send alert when there booking is available for Sky Garden London

To run it:
`
node check.js
`

You can adjust the setting at the top of the `check.js`:
`
//-- settings ----------------------------------------------------------------------------------------
const START_DATE = new Date();
const END_DATE = '2017-12-31';
const CHECK_DELAY_MSEC = 30000;
const SHOW_ZERO_SPACES = false;
`
