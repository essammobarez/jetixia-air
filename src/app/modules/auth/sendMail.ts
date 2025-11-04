// import nodemailer from "nodemailer";

// // Create transporter (you'll need to configure this with your email service)
// const transporter = nodemailer.createTransporter({
//   // Configure with your email service (Gmail, SendGrid, etc.)
//   service: "gmail", // or your preferred service
//   auth: {
//     user: process.env.EMAIL_USER,
//     pass: process.env.EMAIL_PASS,
//   },
// });

// interface EmailOptions {
//   to: string;
//   subject: string;
//   text?: string;
//   html?: string;
// }

// const sendEmail = async (options: EmailOptions) => {
//   try {
//     const mailOptions = {
//       from: process.env.EMAIL_USER,
//       to: options.to,
//       subject: options.subject,
//       text: options.text,
//       html: options.html,
//     };

//     const result = await transporter.sendMail(mailOptions);
//     console.log("Email sent successfully:", result.messageId);
//     return result;
//   } catch (error) {
//     console.error("Error sending email:", error);
//     throw error;
//   }
// };

// export default sendEmail;






