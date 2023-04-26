const nodemailer = require("nodemailer");

// Pull in Environments variables
const EMAIL = {
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  authUser: process.env.AUTH_EMAIL_USERNAME,
  authPass: process.env.AUTH_EMAIL_PASSWORD,
};

async function main(mailOptions) {
  // Create reusable transporter object using the default SMTP transport
  const transporter = nodemailer.createTransport({
    host: EMAIL.host,
    port: EMAIL.port,
    auth: {
      user: EMAIL.authUser,
      pass: EMAIL.authPass,
    },
  });

  // Send mail with defined transport object
  const info = await transporter.sendMail({
    from: mailOptions?.from,
    to: mailOptions?.to,
    subject: mailOptions?.subject,
    text: mailOptions?.text,
    html: mailOptions?.html,
  });

  return info;
}

module.exports = main;
