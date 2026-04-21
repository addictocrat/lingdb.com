import { NextRequest, NextResponse } from "next/server";
import { transporter } from "@/lib/email/client";
import { renderVerifyEmail } from "@/lib/email/templates/verify-email";
import { renderWelcomeEmail } from "@/lib/email/templates/welcome";
import { renderForgotPasswordEmail } from "@/lib/email/templates/forgot-password";
import { renderPaymentProcessedEmail } from "@/lib/email/templates/payment-processed";
import { renderReminderEmail } from "@/lib/email/templates/reminder";

export const runtime = "nodejs";

/**
 * INTERNAL API ROUTE
 * Used to send emails from other API routes or server actions.
 */
export async function POST(request: NextRequest) {
  try {
    const { to, subject, template, data } = await request.json();

    if (!to || !subject || !template) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    let html = "";

    switch (template) {
      case "verify-email":
        html = renderVerifyEmail(data.username, data.verifyLink);
        break;
      case "welcome":
        html = renderWelcomeEmail(data.username, data.loginLink);
        break;
      case "forgot-password":
        html = renderForgotPasswordEmail(data.username, data.resetLink);
        break;
      case "payment-processed":
        html = renderPaymentProcessedEmail(
          data.username,
          data.planName,
          data.amount,
          data.currency,
          data.billingDate,
        );
        break;
      case "reminder":
        html = renderReminderEmail(
          data.username,
          data.dashboardLink,
          data.lastWordTitle,
        );
        break;
      default:
        return NextResponse.json(
          { error: "Invalid template" },
          { status: 400 },
        );
    }

    await transporter.sendMail({
      from: `"Lingdb" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html,
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("Email send error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal Server Error",
      },
      { status: 500 },
    );
  }
}
