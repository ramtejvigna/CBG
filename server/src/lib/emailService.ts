import nodemailer from "nodemailer"
import { EMAIL_USER, EMAIL_PASS } from "../constants.js";

// Validate and narrow environment variables to strings at module init
if (!EMAIL_USER || !EMAIL_PASS) {
    throw new Error("Missing EMAIL_USER or EMAIL_PASS environment variables for email service");
}
const EMAIL_USER_STR: string = EMAIL_USER;
const EMAIL_PASS_STR: string = EMAIL_PASS;

const transporter = nodemailer.createTransport({
    // Gmail configuration
    service: 'gmail',
    auth: {
        user: EMAIL_USER_STR,
        pass: EMAIL_PASS_STR 
    }
});

export const sendPasswordResetEmail = async (
    email: string,
    verificationLink: string
): Promise<nodemailer.SentMessageInfo> => {
    try {
        const mailOptions = {
            from: {
                name: 'SRKR TNP',
                address: EMAIL_USER_STR
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

        const result = await transporter.sendMail(mailOptions);
        console.log('Verification email sent:', result.messageId);
        return result;

    } catch (error) {
        console.error('Error sending verification email:', error);
        throw new Error('Failed to send verification email');
    }
};