import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';

@Injectable()
export class MailService {
    private readonly transporter: Transporter;
    private readonly from: {
        name: string;
        address: string;
    };

    constructor(
        private readonly configService: ConfigService,
    ) {
        const port = Number(
        this.configService.getOrThrow<string>('SMTP_PORT'),
        );

        const secure =
        this.configService.get<string>('SMTP_SECURE') === 'true';

        this.transporter = nodemailer.createTransport({
        host: this.configService.getOrThrow<string>('SMTP_HOST'),
        port,
        secure,
        auth: {
            user: this.configService.getOrThrow<string>('SMTP_USER'),
            pass: this.configService.getOrThrow<string>('SMTP_PASSWORD'),
        },
        });

        this.from = {
        name: this.configService.get<string>(
            'MAIL_FROM_NAME',
            'SUSTINA',
        ),
        address: this.configService.getOrThrow<string>(
            'MAIL_FROM_ADDRESS',
        ),
        };
    }

    async sendRegistrationApproved(
        email: string,
        organizationName: string,
    ): Promise<void> {
        const safeOrganizationName =
        this.escapeHtml(organizationName);

        await this.transporter.sendMail({
        from: this.from,
        to: email,
        subject: 'Your SUSTINA organization registration is approved',
        text: `Your registration for ${organizationName} has been approved. You can now log in to SUSTINA.`,
        html: `
            <!DOCTYPE html>
            <html>
            <body style="font-family: Arial, sans-serif; color: #263238;">
                <h2>Welcome to SUSTINA!</h2>

                <p>
                Your organization
                <strong>${safeOrganizationName}</strong>
                has been approved successfully.
                </p>

                <p>
                Your organization administrator account is now active.
                You can log in using your registered email and password.
                </p>

                <p>Thank you for choosing SUSTINA.</p>
                <p><strong>SUSTINA Team</strong></p>
            </body>
            </html>
        `,
        });
    }

    async sendRegistrationRejected(
        email: string,
        organizationName: string,
        rejectionReason: string,
    ): Promise<void> {
        const safeOrganizationName =
        this.escapeHtml(organizationName);

        const safeReason =
        this.escapeHtml(rejectionReason);

        await this.transporter.sendMail({
        from: this.from,
        to: email,
        subject: 'Update on your SUSTINA registration',
        text:
            `Your registration for ${organizationName} was rejected. ` +
            `Reason: ${rejectionReason}`,
        html: `
            <!DOCTYPE html>
            <html>
            <body style="font-family: Arial, sans-serif; color: #263238;">
                <h2>Registration Update</h2>

                <p>
                Your registration request for
                <strong>${safeOrganizationName}</strong>
                could not be approved.
                </p>

                <p><strong>Reason:</strong></p>

                <p>${safeReason}</p>

                <p>
                If you need further clarification, please contact
                the SUSTINA support team.
                </p>

                <p><strong>SUSTINA Team</strong></p>
            </body>
            </html>
        `,
        });
    }

    async sendPasswordResetOtp(
        email: string,
        otp: string,
        ): Promise<void> {
        await this.transporter.sendMail({
            from: this.configService.getOrThrow<string>('MAIL_FROM_ADDRESS'),
            to: email,
            subject: 'SUSTINA - Password Reset Code',
            html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">
                <h2>Password Reset Request</h2>

                <p>
                We received a request to reset your SUSTINA account password.
                </p>

                <p>Your verification code is:</p>

                <div style="
                font-size: 28px;
                font-weight: bold;
                letter-spacing: 8px;
                padding: 20px;
                background: #f3f4f6;
                text-align: center;
                ">
                ${otp}
                </div>

                <p>
                This code expires in 10 minutes.
                </p>

                <p>
                If you did not request a password reset, you can ignore this email.
                </p>
            </div>
            `,
        });
    }

    private escapeHtml(value: string): string {
        return value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    }
}