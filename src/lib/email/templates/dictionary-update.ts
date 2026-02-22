export function getDictionaryUpdateEmailHtml(
  adderName: string,
  dictionaryTitle: string,
  dictionaryLink: string
) {
  return `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <title>Dictionary Update</title>
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
        border-top: 4px solid #4f46e5;
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
    <div class="content">
      <h2 style="margin-top: 0;">New Word Added!</h2>
      <p>Hi there,</p>
      <p><strong>${adderName}</strong> has just added a new word to the shared dictionary <strong>"${dictionaryTitle}"</strong>.</p>
      
      <div style="text-align: center; margin-top: 30px;">
        <a 
          href="${dictionaryLink}" 
          style="background-color: #4f46e5; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;"
        >
          View Dictionary
        </a>
      </div>
      
      <p style="margin-top: 30px; font-size: 12px; color: #888; text-align: center;">
        Note: To prevent spam, you will only receive this notification once per day per active dictionary.
      </p>
    </div>
    <div class="footer">
      <p>The LingDB Team</p>
    </div>
  </body>
</html>
  `;
}
