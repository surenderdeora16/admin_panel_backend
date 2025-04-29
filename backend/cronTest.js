const cron = require('node-cron');

// Run every 5 seconds (non-standard, but node-cron allows it)
cron.schedule('*/5 * * * * *', () => {
  console.log('Task ran at:', new Date().toLocaleTimeString());
});
