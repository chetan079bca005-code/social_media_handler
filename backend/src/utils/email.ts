import nodemailer from 'nodemailer';
import { config } from '../config';

// Create transporter - uses environment config or falls back to Ethereal test account
let transporter: nodemailer.Transporter | null = null;

async function getTransporter(): Promise<nodemailer.Transporter> {
  if (transporter) return transporter;

  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = parseInt(process.env.SMTP_PORT || '587', 10);
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const smtpFrom = process.env.SMTP_FROM || 'SocialHub <noreply@socialhub.app>';

    });
  } else {
    // Use Ethereal for dev/testing — emails are captured at https://ethereal.email
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
    console.log('📧 Using Ethereal test email account:', testAccount.user);
    console.log('   View sent emails at: https://ethereal.email/login');
  }

  return transporter;
}

function getFromAddress(): string {
  return process.env.SMTP_FROM || 'SocialHub <noreply@socialhub.app>';
}

export async function sendInvitationEmail(params: {
  to: string;
  inviterName: string;
  workspaceName: string;
  role: string;
  inviteToken: string;
}): Promise<{ success: boolean; previewUrl?: string; error?: string }> {
  try {
    const transport = await getTransporter();
    const acceptUrl = `${config.frontendUrl}/invite/${params.inviteToken}`;

    const info = await transport.sendMail({
      from: getFromAddress(),
      to: params.to,
      subject: `You're invited to join "${params.workspaceName}" on SocialHub`,
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f1f5f9; }
    .container { max-width: 560px; margin: 40px auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
    .header { background: linear-gradient(135deg, #6366f1, #8b5cf6); padding: 40px 32px; text-align: center; }
    .header h1 { color: #ffffff; margin: 0; font-size: 28px; font-weight: 700; }
    .header p { color: rgba(255,255,255,0.85); margin: 8px 0 0; font-size: 14px; }
    .body { padding: 32px; }
    .body p { color: #475569; line-height: 1.6; font-size: 15px; margin: 0 0 16px; }
    .role-badge { display: inline-block; background: #ede9fe; color: #6d28d9; padding: 4px 12px; border-radius: 20px; font-size: 13px; font-weight: 600; }
    .btn { display: inline-block; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: #ffffff !important; text-decoration: none; padding: 14px 36px; border-radius: 10px; font-weight: 600; font-size: 15px; margin: 16px 0; }
    .footer { padding: 24px 32px; background: #f8fafc; text-align: center; }
    .footer p { color: #94a3b8; font-size: 12px; margin: 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🚀 SocialHub</h1>
      <p>Team Collaboration Invitation</p>
    </div>
    <div class="body">
      <p>Hi there! 👋</p>
      <p><strong>${params.inviterName}</strong> has invited you to collaborate on <strong>"${params.workspaceName}"</strong> as a <span class="role-badge">${params.role}</span>.</p>
      <p>Join the team and start managing social media content together — schedule posts, analyze performance, and create content with AI.</p>
      <p style="text-align: center;">
        <a href="${acceptUrl}" class="btn">Accept Invitation</a>
      </p>
      <p style="font-size: 13px; color: #94a3b8;">If the button doesn't work, copy this link: <br/>${acceptUrl}</p>
      <p style="font-size: 13px; color: #94a3b8;">This invitation expires in 7 days.</p>
    </div>
    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} SocialHub. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`,
      text: `${params.inviterName} invited you to join "${params.workspaceName}" on SocialHub as ${params.role}.\n\nAccept here: ${acceptUrl}\n\nThis invitation expires in 7 days.`,
    });

    const previewUrl = nodemailer.getTestMessageUrl(info) || undefined;
    if (previewUrl) {
      console.log('📧 Preview invitation email:', previewUrl);
    }

    return { success: true, previewUrl };
  } catch (error: any) {
    console.error('Failed to send invitation email:', error);
    return { success: false, error: error.message };
  }
}

export async function sendGenericEmail(params: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}): Promise<{ success: boolean; previewUrl?: string; error?: string }> {
  try {
    const transport = await getTransporter();
    const info = await transport.sendMail({
      from: getFromAddress(),
      to: params.to,
      subject: params.subject,
      html: params.html,
      text: params.text,
    });

    const previewUrl = nodemailer.getTestMessageUrl(info) || undefined;
    if (previewUrl) {
      console.log('📧 Preview email:', previewUrl);
    }

    return { success: true, previewUrl };
  } catch (error: any) {
    console.error('Failed to send email:', error);
    return { success: false, error: error.message };
  }
}
