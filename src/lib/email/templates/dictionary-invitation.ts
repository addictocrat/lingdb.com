export function getDictionaryInvitationEmailHtml(
  inviterName: string,
  dictionaryTitle: string,
  wordCount: number,
  inviteLink: string
) {
  return `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <title>Dictionary Invitation</title>
    <style>
      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
        line-height: 1.6;
        color: #333333;
        max-width: 600px;
        margin: 0 auto;
        padding: 20px;
      }
      .header {
        text-align: center;
        margin-bottom: 30px;
      }
      .content {
        background-color: #ffffff;
        border-radius: 8px;
        padding: 30px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      }
      .details {
        background-color: #f8f9fa;
        border-radius: 6px;
        padding: 15px;
        margin: 20px 0;
        border-left: 4px solid #4f46e5;
      }
      .button-container {
        text-align: center;
        margin-top: 30px;
      }
      .button {
        display: inline-block;
        background-color: #4f46e5;
        color: #ffffff;
        text-decoration: none;
        padding: 12px 24px;
        border-radius: 6px;
        font-weight: bold;
      }
      .footer {
        text-align: center;
        margin-top: 30px;
        font-size: 14px;
        color: #666666;
      }
    </style>
  </head>
  <body>
    <div class="header">
      <h2>You're Invited!</h2>
    </div>
    <div class="content">
      <p>Hello,</p>
      <p><strong>${inviterName}</strong> has invited you to co-edit their dictionary on LingDB.</p>
      
      <div class="details">
        <p style="margin: 0; margin-bottom: 5px;"><strong>Dictionary:</strong> ${dictionaryTitle}</p>
        <p style="margin: 0;"><strong>Words:</strong> ${wordCount}</p>
      </div>

      <p>As a co-editor, you'll be able to add new words and help grow the dictionary together.</p>

      <div style="text-align: center; margin-top: 30px;">
        <a 
          href="${inviteLink}" 
          style="background-color: #4f46e5; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;"
        >
          Accept Invitation
        </a>
      </div>
      
      <p style="margin-top: 20px; font-size: 14px; color: #666;">
        If you don't wish to accept this invitation, you can safely ignore this email.
      </p>
    </div>
    <div class="footer">
      <p>The LingDB Team</p>
    </div>
  </body>
</html>
  `;
}
