const nodemailer = require("nodemailer");
const sendEmail = async (to, subject, html) => {
  try {
    const transporter = nodemailer.createTransport({
      host: "mail.npi.edu.bd",
      port: 465,
      secure: true,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
    const mailOptions = {
      from: `"NPI Admission Portal" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    };
    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent: " + info.response);
    return true;
  } catch (error) {
    console.error("Error sending email:", error);
    return false;
  }
};
const getStudentEmailTemplate = (name) => `
  <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e0e0e0; border-radius: 15px; overflow: hidden; background-color: #ffffff;">
    <div style="background: linear-gradient(135deg, #1e293b 0%, #1e40af 100%); padding: 40px 20px; text-align: center; color: white;">
      <h1 style="margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -0.5px;">National Polytechnic Institute</h1>
      <p style="margin: 10px 0 0; opacity: 0.9; font-weight: 500;">Admission Confirmation</p>
    </div>
    <div style="padding: 40px 30px; color: #334155;">
      <h2 style="color: #1e293b; margin-top: 0;">Dear ${name},</h2>
      <p style="font-size: 16px; line-height: 1.6;">Thank you for your interest in joining National Polytechnic Institute. We have successfully received your online admission application.</p>
      <p style="font-size: 16px; line-height: 1.6;">Our admissions team is currently reviewing your application and the provided payment details. Once verified, we will contact you for the next steps of the enrollment process.</p>
      <div style="margin: 30px 0; padding: 20px; background-color: #f8fafc; border-radius: 10px; border-left: 4px solid #2563eb;">
        <p style="margin: 0; font-weight: 600; color: #1e293b;">Application Status: <span style="color: #2563eb;">Pending Verification</span></p>
      </div>
      <p style="font-size: 16px; line-height: 1.6;">If you have any questions, feel free to contact our support team at any time.</p>
      <p style="margin-top: 40px; font-size: 14px; color: #64748b;">Best Regards,<br><strong>Admissions Department</strong><br>National Polytechnic Institute</p>
    </div>
    <div style="background-color: #f1f5f9; padding: 20px; text-align: center; font-size: 12px; color: #94a3b8;">
      &copy; ${new Date().getFullYear()} National Polytechnic Institute. All rights reserved.
    </div>
  </div>
`;
const getAdminEmailTemplate = (data) => `
  <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e0e0e0; border-radius: 15px; overflow: hidden; background-color: #ffffff;">
    <div style="background: #1e293b; padding: 30px 20px; text-align: center; color: white;">
      <h1 style="margin: 0; font-size: 22px; font-weight: 800;">New Admission Received!</h1>
      <p style="margin: 5px 0 0; opacity: 0.8; font-size: 14px;">A new application has been submitted through the website</p>
    </div>
    <div style="padding: 30px; color: #334155;">
      <h3 style="color: #1e293b; border-bottom: 2px solid #f1f5f9; padding-bottom: 10px; margin-top: 0;">Applicant Overview</h3>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 25px;">
        <tr>
          <td style="padding: 10px 0; color: #64748b; font-weight: 600; width: 140px;">Full Name:</td>
          <td style="padding: 10px 0; color: #1e293b;">${data.full_name}</td>
        </tr>
        <tr>
          <td style="padding: 10px 0; color: #64748b; font-weight: 600;">Technology:</td>
          <td style="padding: 10px 0; color: #1e293b;">${data.course_id} Technology</td>
        </tr>
        <tr>
          <td style="padding: 10px 0; color: #64748b; font-weight: 600;">Passing Year:</td>
          <td style="padding: 10px 0; color: #1e293b;">${data.pass_year}</td>
        </tr>
        <tr>
          <td style="padding: 10px 0; color: #64748b; font-weight: 600;">Mobile:</td>
          <td style="padding: 10px 0; color: #1e293b;">${data.phone}</td>
        </tr>
      </table>
      <h3 style="color: #1e293b; border-bottom: 2px solid #f1f5f9; padding-bottom: 10px;">Payment Details (bKash)</h3>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
        <tr>
          <td style="padding: 10px 0; color: #64748b; font-weight: 600; width: 140px;">Amount Paid:</td>
          <td style="padding: 10px 0; color: #1e293b; font-weight: 800;">${data.transaction_amount} BDT</td>
        </tr>
        <tr>
          <td style="padding: 10px 0; color: #64748b; font-weight: 600;">Transaction ID:</td>
          <td style="padding: 10px 0; color: #2563eb; font-family: monospace; font-weight: bold;">${data.btransaction_id}</td>
        </tr>
        <tr>
          <td style="padding: 10px 0; color: #64748b; font-weight: 600;">Reference:</td>
          <td style="padding: 10px 0; color: #1e293b;">${data.transaction_reference}</td>
        </tr>
      </table>
      <div style="text-align: center; margin-top: 30px;">
        <a href="${process.env.ADMIN_PANEL_URL || 'https://npi.edu.bd/Admin'}"
           style="background-color: #2563eb; color: white; padding: 15px 35px; text-decoration: none; border-radius: 50px; font-weight: 800; font-size: 14px; box-shadow: 0 10px 15px -3px rgba(37, 99, 235, 0.3);">
           Review Application In Admin Panel
        </a>
      </div>
    </div>
    <div style="background-color: #f1f5f9; padding: 20px; text-align: center; font-size: 12px; color: #94a3b8;">
      This is an automated notification from the NPI Admission Portal.
    </div>
  </div>
`;
const getContactAdminEmailTemplate = (data) => `
  <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e0e0e0; border-radius: 15px; overflow: hidden; background-color: #ffffff;">
    <div style="background: #0f766e; padding: 30px 20px; text-align: center; color: white;">
      <h1 style="margin: 0; font-size: 22px; font-weight: 800;">New Contact Message!</h1>
      <p style="margin: 5px 0 0; opacity: 0.8; font-size: 14px;">A new message has been submitted through the website contact form</p>
    </div>
    <div style="padding: 30px; color: #334155;">
      <h3 style="color: #0f766e; border-bottom: 2px solid #f1f5f9; padding-bottom: 10px; margin-top: 0;">Message Details</h3>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 25px;">
        <tr>
          <td style="padding: 10px 0; color: #64748b; font-weight: 600; width: 120px;">Name:</td>
          <td style="padding: 10px 0; color: #1e293b;">${data.name}</td>
        </tr>
        <tr>
          <td style="padding: 10px 0; color: #64748b; font-weight: 600;">Email:</td>
          <td style="padding: 10px 0; color: #1e293b;">${data.email || 'N/A'}</td>
        </tr>
        <tr>
          <td style="padding: 10px 0; color: #64748b; font-weight: 600;">Phone:</td>
          <td style="padding: 10px 0; color: #1e293b;">${data.phone || 'N/A'}</td>
        </tr>
      </table>
      <h3 style="color: #0f766e; border-bottom: 2px solid #f1f5f9; padding-bottom: 10px;">Message</h3>
      <div style="margin-top: 15px; padding: 20px; background-color: #f0fdfa; border-radius: 10px; line-height: 1.6; color: #1e293b; white-space: pre-wrap;">${data.message || ''}</div>
      <div style="text-align: center; margin-top: 30px;">
        <a href="${process.env.ADMIN_PANEL_URL || 'https://npi.edu.bd/Admin'}"
           style="background-color: #0f766e; color: white; padding: 15px 35px; text-decoration: none; border-radius: 50px; font-weight: 800; font-size: 14px; box-shadow: 0 10px 15px -3px rgba(15, 118, 110, 0.3);">
           View Message In Admin Panel
        </a>
      </div>
    </div>
    <div style="background-color: #f1f5f9; padding: 20px; text-align: center; font-size: 12px; color: #94a3b8;">
      This is an automated notification from NPI Website.
    </div>
  </div>
`;
const getStudentFeedbackAdminEmailTemplate = (data) => `
  <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e0e0e0; border-radius: 15px; overflow: hidden; background-color: #ffffff;">
    <div style="background: #7c3aed; padding: 30px 20px; text-align: center; color: white;">
      <h1 style="margin: 0; font-size: 22px; font-weight: 800;">New Student Feedback!</h1>
      <p style="margin: 5px 0 0; opacity: 0.8; font-size: 14px;">A new feedback has been submitted for review</p>
    </div>
    <div style="padding: 30px; color: #334155;">
      <h3 style="color: #7c3aed; border-bottom: 2px solid #f1f5f9; padding-bottom: 10px; margin-top: 0;">Feedback Overview</h3>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 25px;">
        <tr>
          <td style="padding: 10px 0; color: #64748b; font-weight: 600; width: 130px;">Name:</td>
          <td style="padding: 10px 0; color: #1e293b;">${data.name}</td>
        </tr>
        <tr>
          <td style="padding: 10px 0; color: #64748b; font-weight: 600;">Type:</td>
          <td style="padding: 10px 0; color: #1e293b; text-transform: capitalize;">${data.type || 'Student'}</td>
        </tr>
        <tr>
          <td style="padding: 10px 0; color: #64748b; font-weight: 600;">Department:</td>
          <td style="padding: 10px 0; color: #1e293b;">${data.department || 'N/A'}</td>
        </tr>
        <tr>
          <td style="padding: 10px 0; color: #64748b; font-weight: 600;">Semester:</td>
          <td style="padding: 10px 0; color: #1e293b;">${data.semester || 'N/A'}</td>
        </tr>
      </table>
      <h3 style="color: #7c3aed; border-bottom: 2px solid #f1f5f9; padding-bottom: 10px;">Feedback Message</h3>
      <div style="margin-top: 15px; padding: 20px; background-color: #faf5ff; border-radius: 10px; line-height: 1.6; color: #1e293b; white-space: pre-wrap;">${data.message || ''}</div>
      <div style="text-align: center; margin-top: 30px;">
        <a href="${process.env.ADMIN_PANEL_URL || 'https://npi.edu.bd/Admin'}"
           style="background-color: #7c3aed; color: white; padding: 15px 35px; text-decoration: none; border-radius: 50px; font-weight: 800; font-size: 14px; box-shadow: 0 10px 15px -3px rgba(124, 58, 237, 0.3);">
           Review Feedback In Admin Panel
        </a>
      </div>
    </div>
    <div style="background-color: #f1f5f9; padding: 20px; text-align: center; font-size: 12px; color: #94a3b8;">
      This is an automated notification from NPI Website.
    </div>
  </div>
`;
const getParentsFeedbackAdminEmailTemplate = (data) => `
  <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e0e0e0; border-radius: 15px; overflow: hidden; background-color: #ffffff;">
    <div style="background: #c2410c; padding: 30px 20px; text-align: center; color: white;">
      <h1 style="margin: 0; font-size: 22px; font-weight: 800;">New Parents Feedback!</h1>
      <p style="margin: 5px 0 0; opacity: 0.8; font-size: 14px;">A new parents feedback has been submitted for review</p>
    </div>
    <div style="padding: 30px; color: #334155;">
      <h3 style="color: #c2410c; border-bottom: 2px solid #f1f5f9; padding-bottom: 10px; margin-top: 0;">Feedback Overview</h3>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 25px;">
        <tr>
          <td style="padding: 10px 0; color: #64748b; font-weight: 600; width: 130px;">Name:</td>
          <td style="padding: 10px 0; color: #1e293b;">${data.name}</td>
        </tr>
        <tr>
          <td style="padding: 10px 0; color: #64748b; font-weight: 600;">Occupation:</td>
          <td style="padding: 10px 0; color: #1e293b;">${data.occupation || 'N/A'}</td>
        </tr>
      </table>
      <h3 style="color: #c2410c; border-bottom: 2px solid #f1f5f9; padding-bottom: 10px;">Feedback Message</h3>
      <div style="margin-top: 15px; padding: 20px; background-color: #fff7ed; border-radius: 10px; line-height: 1.6; color: #1e293b; white-space: pre-wrap;">${data.message || ''}</div>
      <div style="text-align: center; margin-top: 30px;">
        <a href="${process.env.ADMIN_PANEL_URL || 'https://npi.edu.bd/Admin'}"
           style="background-color: #c2410c; color: white; padding: 15px 35px; text-decoration: none; border-radius: 50px; font-weight: 800; font-size: 14px; box-shadow: 0 10px 15px -3px rgba(194, 65, 12, 0.3);">
           Review Feedback In Admin Panel
        </a>
      </div>
    </div>
    <div style="background-color: #f1f5f9; padding: 20px; text-align: center; font-size: 12px; color: #94a3b8;">
      This is an automated notification from NPI Website.
    </div>
  </div>
`;
module.exports = {
  sendEmail,
  getStudentEmailTemplate,
  getAdminEmailTemplate,
  getContactAdminEmailTemplate,
  getStudentFeedbackAdminEmailTemplate,
  getParentsFeedbackAdminEmailTemplate,
};
