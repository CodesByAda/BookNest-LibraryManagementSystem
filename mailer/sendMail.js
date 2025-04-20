require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mjml = require('mjml');
const transporter = require('./index');

const sendMail = async (to, subject, mjmlFile, context = {}) => {
  const mjmlPath = path.join(__dirname, '..', 'emails', mjmlFile);
  let mjmlTemplate = fs.readFileSync(mjmlPath, 'utf-8');

  // Replace placeholders like {{username}}
  for (let key in context) {
    mjmlTemplate = mjmlTemplate.replaceAll(`{{${key}}}`, context[key]);
  }

  const { html } = mjml(mjmlTemplate);

  const mailOptions = {
    from: `"BookNest" <booknestnotifications@gmail.com>`,
    to,
    subject,
    html
  };

  await transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error('❌ Email sending failed:', error);
    } else {
      console.log('✅ Email sent:', info.response);
    }
  });  
};

module.exports = sendMail;
