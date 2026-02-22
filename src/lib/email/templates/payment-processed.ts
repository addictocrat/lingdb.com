export function renderPaymentProcessedEmail(
  username: string,
  planName: string,
  amount: string,
  currency: string,
  billingDate: string
) {
  return `
    <div style="font-family: sans-serif; line-height: 1.5; color: #1a1a1a; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #f8f9fa; padding: 20px; border-radius: 12px; text-align: center;">
        <h1 style="color: #5c7cfa; margin: 0;">Payment Successful!</h1>
        <p style="font-size: 18px; color: #4c6ef5;">Thank you for upgrading to ${planName}</p>
      </div>

      <p style="margin-top: 20px;">Hi ${username},</p>
      <p>We've successfully processed your payment. Your Lingdb Premium subscription is now active!</p>

      <div style="background-color: #ffffff; border: 1px solid #dee2e6; border-radius: 8px; padding: 20px; margin: 20px 0;">
        <h3 style="margin: 0 0 15px 0; border-bottom: 1px solid #eee; padding-bottom: 10px;">Order Receipt</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; color: #666;">Plan</td>
            <td style="padding: 8px 0; text-align: right; font-weight: bold;">${planName}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #666;">Amount Paid</td>
            <td style="padding: 8px 0; text-align: right; font-weight: bold;">${currency}${amount}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #666;">Next Billing Date</td>
            <td style="padding: 8px 0; text-align: right; font-weight: bold;">${billingDate}</td>
          </tr>
        </table>
      </div>

      <p>You now have full access to all Premium features, including unlimited AI credits and an ad-free experience.</p>

      <div style="text-align: center; margin: 30px 0;">
        <a 
          href="${process.env.NEXT_PUBLIC_APP_URL}/profile/settings"
          style="background: #5c7cfa; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;"
        >
          Manage Subscription
        </a>
      </div>

      <p>Thanks for supporting Lingdb!<br/>The Lingdb Team</p>
    </div>
  `;
}
