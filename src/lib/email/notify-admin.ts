import { transporter } from './client';

export async function sendAdminNewUserNotification(username: string, email: string) {
  try {
    const toEmail = process.env.ADMIN_ALERTS_EMAIL;
    console.log(`[Email Debug] Preparing to send new user notification for ${username} (${email})`);
    console.log(`[Email Debug] ADMIN_ALERTS_EMAIL is: ${toEmail}`);
    
    if (!toEmail) {
      console.error('[Email Error] ADMIN_ALERTS_EMAIL is missing from environment variables');
      return;
    }

    const info = await transporter.sendMail({
      from: `"Lingdb" <${process.env.SMTP_USER}>`,
      to: toEmail,
      subject: `New User Signup: ${username}`,
      text: `${username} (${email}) signed up to Lingdb.`,
      html: `<p><strong>${username}</strong> (${email}) signed up to Lingdb.</p>`,
    });
    console.log(`Sent admin notification for new user: ${username}, info: ${info.messageId}`);
  } catch (error) {
    console.error('Error sending admin notification for new user:', error);
  }
}

