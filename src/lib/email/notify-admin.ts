import { transporter } from './client';

export async function sendAdminNewUserNotification(username: string) {
  try {
    await transporter.sendMail({
      from: `"Lingdb" <${process.env.SMTP_USER}>`,
      to: `${process.env.ADMIN_ALERTS_EMAIL}`,
      subject: `New User Signup: ${username}`,
      text: `${username} signed up to Lingdb.`,
      html: `<p>${username} signed up to Lingdb.</p>`,
    });
    console.log(`Sent admin notification for new user: ${username}`);
  } catch (error) {
    console.error('Error sending admin notification for new user:', error);
  }
}
