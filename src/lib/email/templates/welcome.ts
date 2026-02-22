export function renderWelcomeEmail(username: string, loginLink: string) {
  return `
    <div style="font-family: sans-serif; line-height: 1.5; color: #1a1a1a;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #5c7cfa; margin: 0;">Welcome Aboard! 🎉</h1>
      </div>
      
      <p>Hi ${username},</p>
      <p>Your email has been verified and your Lingdb account is officially ready to go. You now have access to:</p>
      
      <ul style="padding-left: 20px; margin-bottom: 30px;">
        <li style="margin-bottom: 10px;"><strong>Unlimited Dictionaries:</strong> Build specialized vocab lists for any topic.</li>
        <li style="margin-bottom: 10px;"><strong>Flashcards & Quizzes:</strong> Test your knowledge with spaced repetition tracking.</li>
        <li style="margin-bottom: 10px;"><strong>AI Assistants:</strong> Use your 30 monthly AI credits to auto-generate example sentences and contexts.</li>
      </ul>

      <div style="text-align: center; margin: 40px 0;">
        <a 
          href="${loginLink}"
          style="background: #5c7cfa; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; font-size: 16px;"
        >
          Go to Dashboard
        </a>
      </div>

      <p>If you have any questions, simply reply to this email. We're here to help.</p>

      <p>Happy learning,<br/>The Lingdb Team</p>
    </div>
  `;
}
