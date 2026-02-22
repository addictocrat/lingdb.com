export function renderForgotPasswordEmail(username: string, resetLink: string) {
  return `
    <div style="font-family: sans-serif; line-height: 1.5; color: #1a1a1a;">
      <h2 style="color: #fa5252;">Reset your Lingdb Password</h2>
      <p>Hi ${username},</p>
      <p>Someone recently requested a password change for your Lingdb account. If this was you, you can set a new password here:</p>
      
      <div style="margin: 30px 0;">
        <a 
          href="${resetLink}"
          target="_blank"
          style="background: #fa5252; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block; cursor: pointer;"
        >
          Reset Password
        </a>
      </div>

      <p style="font-size: 13px; color: #666; border-left: 3px solid #eee; padding-left: 10px;">
        This link will expire in 1 hour.
      </p>

      <p style="font-size: 13px; color: #666; margin-top: 20px;">
        If the button doesn't work, copy and paste this link into your browser:<br/>
        <a href="${resetLink}" style="word-break: break-all; color: #fa5252;">${resetLink}</a>
      </p>

      <p style="margin-top: 30px;">
        If you didn't request a password reset, you can safely ignore this email. Your account remains secure.
      </p>

      <p>Thanks,<br/>The Lingdb Team</p>
    </div>
  `;
}
