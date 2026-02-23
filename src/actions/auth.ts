'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { transporter } from '@/lib/email/client';
import { renderVerifyEmail } from '@/lib/email/templates/verify-email';
import { renderForgotPasswordEmail } from '@/lib/email/templates/forgot-password';
import { APP_URL } from '@/lib/utils/constants';
import { sendAdminNewUserNotification } from '@/lib/email/notify-admin';

/**
 * Sign up a new user with email + password.
 * Creates the user (unconfirmed) via admin API, generates a verification link,
 * and sends a custom email via SMTP.
 */
export async function signUp(email: string, password: string) {
  try {
    const admin = createAdminClient();

    // Create user with email_confirm: false
    const { error: createError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: false,
    });

    if (createError) {
      // If user already exists, return a friendly message
      if (createError.message.includes('already been registered')) {
        return { success: false, error: 'An account with this email already exists.' };
      }
      console.error('Error creating user:', createError);
      return { success: false, error: createError.message };
    }

    // Generate signup confirmation link
    const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
      type: 'signup',
      email,
      password,
    });

    if (linkError || !linkData) {
      console.error('Error generating verification link:', linkError);
      return { success: false, error: 'Failed to generate verification link.' };
    }

    // Build the verify URL using the hashed_token from the link properties
    const tokenHash = linkData.properties.hashed_token;
    const verifyUrl = `${APP_URL}/api/auth/verify?token_hash=${encodeURIComponent(tokenHash)}&type=signup`;

    // Send verification email
    const html = renderVerifyEmail(email.split('@')[0], verifyUrl);
    await transporter.sendMail({
      from: `"Lingdb" <${process.env.SMTP_USER}>`,
      to: email,
      subject: 'Verify your Lingdb account',
      html,
    });

    // Notify admin (fire and forget)
    sendAdminNewUserNotification(email.split('@')[0], email).catch(console.error);

    return { success: true };
  } catch (error: any) {
    console.error('Unexpected error in signUp:', error);
    return { success: false, error: error.message || 'Something went wrong.' };
  }
}

/**
 * Resend verification email for an existing unconfirmed user.
 */
export async function resendVerificationEmail(email: string) {
  try {
    const admin = createAdminClient();

    const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
      type: 'magiclink',
      email,
    });

    if (linkError || !linkData) {
      console.error('Error generating verification link:', linkError);
      return { success: false, error: 'Failed to generate verification link.' };
    }

    const tokenHash = linkData.properties.hashed_token;
    const verifyUrl = `${APP_URL}/api/auth/verify?token_hash=${encodeURIComponent(tokenHash)}&type=magiclink`;

    const html = renderVerifyEmail(email.split('@')[0], verifyUrl);
    await transporter.sendMail({
      from: `"Lingdb" <${process.env.SMTP_USER}>`,
      to: email,
      subject: 'Verify your Lingdb account',
      html,
    });

    return { success: true };
  } catch (error: any) {
    console.error('Unexpected error in resendVerificationEmail:', error);
    return { success: false, error: error.message || 'Something went wrong.' };
  }
}

/**
 * Send a password reset email with a recovery link.
 */
export async function sendPasswordResetEmail(email: string) {
  try {
    const admin = createAdminClient();

    const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
      type: 'recovery',
      email,
    });

    if (linkError || !linkData) {
      console.error('Error generating recovery link:', linkError);
      return { success: false, error: 'Failed to generate reset link.' };
    }

    const tokenHash = linkData.properties.hashed_token;
    const verifyUrl = `${APP_URL}/api/auth/verify?token_hash=${encodeURIComponent(tokenHash)}&type=recovery`;

    const html = renderForgotPasswordEmail(email.split('@')[0], verifyUrl);
    await transporter.sendMail({
      from: `"Lingdb" <${process.env.SMTP_USER}>`,
      to: email,
      subject: 'Reset your Lingdb password',
      html,
    });

    return { success: true };
  } catch (error: any) {
    console.error('Unexpected error in sendPasswordResetEmail:', error);
    return { success: false, error: error.message || 'Something went wrong.' };
  }
}
