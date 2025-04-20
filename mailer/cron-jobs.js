const cron = require('node-cron');
const sendDueReminders = require('./automations/overdue');

cron.schedule('0 10 * * *', async () => {
  console.log('Running due reminder cron job...');
  await sendDueReminders();
});

const sendPostDueReminders = require('./automations/postdue');
cron.schedule('57 10 * * *', async () => {
  console.log('Running 3-day overdue reminder cron job...');
  await sendPostDueReminders();
});