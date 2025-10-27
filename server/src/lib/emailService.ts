import nodemailer from "nodemailer"
import { EMAIL_USER, EMAIL_PASS } from "../constants.js";

// Create a lazy-initialized transporter
let transporter: nodemailer.Transporter | null = null;
let emailServiceAvailable = false;

const getTransporter = (): nodemailer.Transporter => {
    if (!transporter) {
        // Validate environment variables when first accessing transporter
        if (!EMAIL_USER || !EMAIL_PASS) {
            emailServiceAvailable = false;
            console.warn("Warning: EMAIL_USER or EMAIL_PASS environment variables not set. Email functionality will be disabled.");
            throw new Error("Email service not configured - missing EMAIL_USER or EMAIL_PASS environment variables");
        }
        
        emailServiceAvailable = true;
        const EMAIL_USER_STR: string = EMAIL_USER;
        const EMAIL_PASS_STR: string = EMAIL_PASS;

        transporter = nodemailer.createTransport({
            // Gmail configuration
            service: 'gmail',
            auth: {
                user: EMAIL_USER_STR,
                pass: EMAIL_PASS_STR 
            }
        });
    }
    return transporter;
};

// Export a function to check if email service is available
export const isEmailServiceAvailable = (): boolean => {
    try {
        return !!(EMAIL_USER && EMAIL_PASS);
    } catch {
        return false;
    }
};

export const sendPasswordResetEmail = async (
    email: string,
    verificationLink: string
): Promise<nodemailer.SentMessageInfo> => {
    try {
        const emailTransporter = getTransporter();
        const emailUser = EMAIL_USER;
        
        if (!emailUser) {
            throw new Error("EMAIL_USER not configured");
        }
        
        const mailOptions = {
            from: {
                name: 'SRKR TNP',
                address: emailUser
            },
            to: email,
            subject: 'Complete Your Profile - Verification Required',
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="utf-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Complete Your Profile</title>
                </head>
                <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                        <h1 style="color: white; margin: 0;">Welcome!</h1>
                        <p style="color: white; margin: 10px 0 0 0;">Complete your profile to get started</p>
                    </div>
                    
                    <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
                        <p>Hello,</p>
                        
                        <p>An account has been created for you. To complete your profile and access your account, please click the button below:</p>
                        
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="${verificationLink}" 
                               style="background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
                                Complete Profile
                            </a>
                        </div>
                        
                        <p>If the button doesn't work, you can also copy and paste this link into your browser:</p>
                        <p style="word-break: break-all; color: #667eea;">${verificationLink}</p>
                        
                        <p><strong>Important:</strong> This link will expire in 48 hours for security reasons.</p>
                        
                        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
                        
                        <p style="color: #666; font-size: 14px;">
                            If you didn't request this account, please ignore this email.
                        </p>
                    </div>
                </body>
                </html>
            `
        };

        const result = await emailTransporter.sendMail(mailOptions);
        console.log('Verification email sent:', result.messageId);
        return result;

    } catch (error) {
        console.error('Error sending verification email:', error);
        throw new Error('Failed to send verification email');
    }
};