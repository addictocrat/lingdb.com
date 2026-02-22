'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { transporter } from '@/lib/email/client';
import { renderVerifyEmail } from '@/lib/email/templates/verify-email';
import { renderForgotPasswordEmail } from '@/lib/email/templates/forgot-password';
import { APP_URL } from '@/lib/utils/constants';
import { sendAdminNewUserNotification } from '@/lib/email/notify-admin';


export async function registerUserWithVerification(email: string, password?: string) {
  try {
    const supabaseAdmin = createAdminClient();

    // 1. Create the user using the Admin API, forcing email_confirm to false
    const { data: createUserResult, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: false,
    });

    if (createError) {
      console.error('Error creating user:', createError);
      return { success: false, error: createError.message };
    }

    // 2. Generate the signup verification link
    const linkParams: any = {
      type: 'signup',
      email,
    };
    if (password) {
      linkParams.password = password;
    }

    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink(linkParams);

    if (linkError) {
      console.error('Error generating link:', linkError);
      return { success: false, error: 'Failed to generate verification link' };
    }

    let verifyLink = linkData.properties.action_link;

    // Rewrite the generated Supabase link to point to our internal app verification route
    try {
      const appUrl = APP_URL;
      const linkUrl = new URL(verifyLink);
      
      const token = linkUrl.searchParams.get('token');
      const type = linkUrl.searchParams.get('type') || 'signup';

      if (token) {
        verifyLink = `${appUrl}/api/auth/verify?token=${encodeURIComponent(token)}&type=${encodeURIComponent(type)}`;
      }
    } catch (e) {
      console.error('Failed to rewrite verification URL:', e);
    }

    // 3. Send the verification email using Spacemail / Nodemailer
    const html = renderVerifyEmail(email.split('@')[0], verifyLink);

    await transporter.sendMail({
      from: `"Lingdb" <${process.env.SMTP_USER}>`,
      to: email,
      subject: 'Verify your Lingdb account',
      html,
    });

    // Notify admin about the new signup directly
    sendAdminNewUserNotification(email.split('@')[0], email).catch(console.error);

    return { success: true };
  } catch (error: any) {
    console.error('Unexpected error in registerUserWithVerification:', error);
    return { success: false, error: error.message || 'Something went wrong' };
  }
}

export async function resendVerificationEmail(email: string) {
  try {
    const supabaseAdmin = createAdminClient();

    // 1. Generate the magiclink verification link again for the existing user
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email,
    });

    if (linkError) {
      console.error('Error generating link:', linkError);
      return { success: false, error: 'Failed to generate verification link' };
    }

    let verifyLink = linkData.properties.action_link;

    // Rewrite the generated Supabase link to point to our internal app verification route
    try {
      const appUrl = APP_URL;
      const linkUrl = new URL(verifyLink);
      
      const token = linkUrl.searchParams.get('token');
      const type = linkUrl.searchParams.get('type') || 'magiclink';

      if (token) {
        verifyLink = `${appUrl}/api/auth/verify?token=${encodeURIComponent(token)}&type=${encodeURIComponent(type)}`;
      }
    } catch (e) {
      console.error('Failed to rewrite verification URL:', e);
    }

    // 2. Send the verification email using Spacemail / Nodemailer
    const html = renderVerifyEmail(email.split('@')[0], verifyLink);

    await transporter.sendMail({
      from: `"Lingdb" <${process.env.SMTP_USER}>`,
      to: email,
      subject: 'Verify your Lingdb account',
      html,
    });

    return { success: true };
  } catch (error: any) {
    console.error('Unexpected error in resendVerificationEmail:', error);
    return { success: false, error: error.message || 'Something went wrong' };
  }
}

export async function sendPasswordResetEmail(email: string) {
  try {
    const supabaseAdmin = createAdminClient();

    // 1. Generate the recovery verification link for the existing user
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email,
    });

    if (linkError) {
      console.error('Error generating link:', linkError);
      return { success: false, error: 'Failed to generate reset link' };
    }

    let verifyLink = linkData.properties.action_link;

    // Rewrite the generated Supabase link to point to our internal app verification route
    try {
      const appUrl = APP_URL;
      const linkUrl = new URL(verifyLink);
      
      const token = linkUrl.searchParams.get('token');
      const type = linkUrl.searchParams.get('type') || 'recovery';

      if (token) {
        verifyLink = `${appUrl}/api/auth/verify?token=${encodeURIComponent(token)}&type=${encodeURIComponent(type)}`;
      }
    } catch (e) {
      console.error('Failed to rewrite verification URL:', e);
    }

    // 2. Send the verification email using Spacemail / Nodemailer
    const html = renderForgotPasswordEmail(email.split('@')[0], verifyLink);

    await transporter.sendMail({
      from: `"Lingdb" <${process.env.SMTP_USER}>`,
      to: email,
      subject: 'Reset your Lingdb password',
      html,
    });

    return { success: true };
  } catch (error: any) {
    console.error('Unexpected error in sendPasswordResetEmail:', error);
    return { success: false, error: error.message || 'Something went wrong' };
  }
}
