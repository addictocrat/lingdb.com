export function renderVerifyEmail(username: string, verifyLink: string) {
  return `
    <div style="font-family: sans-serif; line-height: 1.5; color: #1a1a1a;">
      <h1 style="color: #5c7cfa;">Welcome to Lingdb, ${username}!</h1>
      <p>We are thrilled to have you. To start creating dictionaries and learning, please verify your email address by clicking the button below:</p>
      
      <div style="margin: 30px 0;">
        <a 
          href="${verifyLink}"
          style="background: #5c7cfa; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;"
        >
          Verify Email Address
        </a>
      </div>

      <p style="font-size: 13px; color: #666;">
        If the button doesn't work, copy and paste this link into your browser:<br/>
        <a href="${verifyLink}">${verifyLink}</a>
      </p>

      <p>Happy learning,<br/>The Lingdb Team</p>
    </div>
  `;
}
