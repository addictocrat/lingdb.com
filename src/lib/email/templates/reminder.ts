export function renderReminderEmail(
  username: string,
  dashboardLink: string,
  lastWordTitle?: string
) {
  const wordSection = lastWordTitle 
    ? `
      <div style="background-color: #f0f4ff; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #5c7cfa;">
        <p style="margin: 0; font-style: italic; color: #4c6ef5;">
          Remember your last word? <strong>"${lastWordTitle}"</strong>
        </p>
      </div>
    `
    : '';

  return `
    <div style="font-family: sans-serif; line-height: 1.5; color: #1a1a1a; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #5c7cfa;">We miss you on Lingdb, ${username}!</h1>
      
      <p>It's been a while since we last saw you. Consistency is the key to mastering a new language, and even 5 minutes a day can make a huge difference!</p>
      
      ${wordSection}

      <p>Why not jump back in for a quick quiz or learn a few new words today?</p>

      <div style="text-align: center; margin: 30px 0;">
        <a 
          href="${dashboardLink}"
          style="background: #5c7cfa; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; font-size: 16px;"
        >
          Resume Learning
        </a>
      </div>

      <p>Keep up the great work!<br/>The Lingdb Team</p>

      <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
      <p style="font-size: 11px; color: #999; text-align: center;">
        You received this because you haven't been active on Lingdb lately. 
        Don't want these reminders? <a href="${process.env.NEXT_PUBLIC_APP_URL}/profile/settings" style="color: #999;">Unsubscribe here</a>.
      </p>
    </div>
  `;
}
