import {
    Injectable,
    UnauthorizedException,
    BadRequestException,
    InternalServerErrorException,
} from '@nestjs/common';

import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service.js';
import { MailService } from '../mail/mail.service.js';

import * as bcrypt from 'bcrypt';
import {
    createHash,
    createHmac,
    randomBytes,
    randomInt,
    timingSafeEqual,
} from 'node:crypto';

import { LoginDto } from './dto/login.dto.js';
import { ForgotPasswordDto } from './dto/forgot-password.dto.js';
import { ResetPasswordDto } from './dto/reset-password.dto.js';

const REFRESH_COOKIE_NAME = 'sustina_refresh';
const OTP_EXPIRATION_MINUTES = 10;
const MAX_OTP_ATTEMPTS = 5;

@Injectable()
export class AuthService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly jwtService: JwtService,
        private readonly configService: ConfigService,
        private readonly mailService: MailService,
    ) {}

    // ----------------------------------
    // Helpers
    // ----------------------------------
    private hashRefreshToken(token: string): string {
        return createHash('sha256').update(token).digest('hex');
    }

    private hashOtp(otp: string): string {
        const secret = this.configService.getOrThrow<string>(
        'OTP_HASH_SECRET',
        );
        return createHmac('sha256', secret).update(otp).digest('hex');
    }

    private isSameHash(a: string, b: string): boolean {
        const bufferA = Buffer.from(a, 'hex');
        const bufferB = Buffer.from(b, 'hex');

        if (bufferA.length !== bufferB.length) {
        return false;
        }
        return timingSafeEqual(bufferA, bufferB);
    }

    private getRefreshExpiration(): Date {
        const days = Number(
        this.configService.get('REFRESH_TOKEN_EXPIRES_DAYS', '7'),
        );

        if (!Number.isInteger(days) || days < 1 || days > 30) {
            throw new InternalServerErrorException(
                'Invalid refresh token expiration configuration',
            );
        }
        return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
    }

    private createRefreshToken(): string {
        return randomBytes(48).toString('hex');
    }

    private async createAccessToken(user: {
        id: string;
        email: string;
        role: string;
        organizationId: string | null;
    }): Promise<string> {
        return this.jwtService.signAsync({
        sub: user.id,
        email: user.email,
        role: user.role,
        organizationId: user.organizationId,
        });
    }

    private async createRefreshSession(userId: string) {
        const refreshToken = this.createRefreshToken();
        await this.prisma.refreshSession.create({
        data: {
            userId,
            tokenHash: this.hashRefreshToken(refreshToken),
            expiresAt: this.getRefreshExpiration(),
        },
        });
        return refreshToken;
    }

    // ----------------------------------
    // Login
    // ----------------------------------
    async login(dto: LoginDto) {
        // 1. Find the user by email
        const user = await this.prisma.user.findUnique({
            where: {
                email: dto.email,
            },
            include: {
                organization: {
                select: {
                    id: true,
                    legalName: true,
                    status: true,
                },
                },
            },
        });

        // 2. Reject if user does not exist
        if (!user || user.deletedAt) {
            throw new UnauthorizedException('Invalid email or password');
        }

        // 3. Compare entered password with stored hash
        if (!user.passwordHash) {
            throw new UnauthorizedException(
                'Please complete your account setup before logging in',
            );
        }
        const isPasswordValid = await bcrypt.compare(
            dto.password,
            user.passwordHash,
        );

        if (!isPasswordValid) {
            throw new UnauthorizedException('Invalid email or password');
        }

        // 4. Check user account status
        if (user.status !== 'ACTIVE') {
            throw new UnauthorizedException(
                'Your account is not active',
            );
        }

        // 5. Organization users must belong to an active organization
        if (user.role !== 'SUPER_ADMIN') {
            if (
                !user.organization ||
                user.organization.status !== 'ACTIVE'
            ) {
                throw new UnauthorizedException(
                'Your organization is not active',
                );
            }
            if (!user.organizationId) {
                throw new UnauthorizedException(
                'User is not associated with an organization',
                );
            }
        }

        if (user.deletedAt) {
            throw new UnauthorizedException(
                'Invalid email or password',
            );
        }

        // 6. Generate access and refresh token
        const accessToken = await this.createAccessToken(user);
        const refreshToken = await this.createRefreshSession(user.id);

        await this.prisma.user.update({
            where: { id: user.id },
            data: { lastLoginAt: new Date() },
        });

        // 7. Return safe user information
        return {
            message: 'Login successful',
            accessToken,
            refreshToken,
            tokenType: 'Bearer',
            expiresIn: this.configService.get<string>(
                'JWT_ACCESS_EXPIRES_IN',
                '15m',
            ),
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
                status: user.status,
                organizationId: user.organizationId,
                organization: user.organization
                ? {
                    id: user.organization.id,
                    legalName: user.organization.legalName,
                    status: user.organization.status,
                    }
                : null,
            },
        };
    }

    // ----------------------------------
    // Refresh Token
    // ----------------------------------
    async refresh(refreshToken: string) {
        if (!refreshToken || typeof refreshToken !== 'string') {
            throw new UnauthorizedException('Refresh token is required');
        }

        const tokenHash = this.hashRefreshToken(refreshToken);

        const session = await this.prisma.refreshSession.findUnique({
        where: { tokenHash },
        include: {
            user: {
            include: {
                organization: {
                select: {
                    id: true,
                    legalName: true,
                    status: true,
                },
                },
            },
            },
        },
        });

        if (
            !session ||
            session.revokedAt ||
            session.expiresAt <= new Date()
        ) {
            throw new UnauthorizedException('Invalid refresh session');
        }

        const user = session.user;

        if (user.status !== 'ACTIVE') {
        throw new UnauthorizedException('User account is not active');
        }

        if (user.role !== 'SUPER_ADMIN') {
            if (
                !user.organization ||
                user.organization.status !== 'ACTIVE' ||
                !user.organizationId
            ) {
                throw new UnauthorizedException('Organization is not active');
            }
        }

        if (user.deletedAt) {
            throw new UnauthorizedException(
                'User account is not available',
            );
        }

        const newRefreshToken = this.createRefreshToken();
        const newTokenHash = this.hashRefreshToken(newRefreshToken);
        const newExpiration = this.getRefreshExpiration();

        const accessToken = await this.createAccessToken(user);

        await this.prisma.$transaction(async (tx) => {
        const revoked = await tx.refreshSession.updateMany({
            where: {
            id: session.id,
            revokedAt: null,
            expiresAt: { gt: new Date() },
            },
            data: {
            revokedAt: new Date(),
            },
        });

        if (revoked.count !== 1) {
            throw new UnauthorizedException(
            'Refresh session has already been used',
            );
        }

        await tx.refreshSession.create({
            data: {
                userId: user.id,
                tokenHash: newTokenHash,
                expiresAt: newExpiration,
                },
            });
        });

        return {
            accessToken,
            refreshToken: newRefreshToken,
            tokenType: 'Bearer',
            expiresIn: this.configService.get<string>(
                'JWT_ACCESS_EXPIRES_IN',
                '15m',
            ),
        };
    }

    // ----------------------------------
    // Logout
    // ----------------------------------
    async logout(refreshToken?: string) {
        if (!refreshToken) {
            return {
                message: 'Logged out successfully',
            };
        }
        const tokenHash = this.hashRefreshToken(refreshToken);

        await this.prisma.refreshSession.updateMany({
            where: {
                tokenHash,
                revokedAt: null,
            },
            data: {
                revokedAt: new Date(),
            },
        });
        return {
            message: 'Logged out successfully',
        };
    }

    // ----------------------------------
    // Forgot Password
    // ----------------------------------
    async forgotPassword(dto: ForgotPasswordDto) {
        const genericResponse = {
        message:
            'If an account exists with this email, a password reset code will be sent.',
        };

        const user = await this.prisma.user.findUnique({
        where: { email: dto.email },
        });

        // Do not reveal whether the email exists.
        if (!user || user.status !== 'ACTIVE') {
        return genericResponse;
        }

        const otp = randomInt(0, 1_000_000)
        .toString()
        .padStart(6, '0');

        const otpHash = this.hashOtp(otp);

        const expiresAt = new Date(
            Date.now() + OTP_EXPIRATION_MINUTES * 60 * 1000,
        );

        await this.prisma.$transaction([
        this.prisma.passwordResetOtp.updateMany({
            where: {
                userId: user.id,
                usedAt: null,
            },
            data: {
                usedAt: new Date(),
            },
        }),

        this.prisma.passwordResetOtp.create({
            data: {
            userId: user.id,
            otpHash,
            expiresAt,
            },
        }),
        ]);

        try {
            await this.mailService.sendPasswordResetOtp(
                user.email,
                otp,
            );
        } catch {
            // Do not expose email delivery details to the caller.
            // The OTP is still stored, but the user may request another one.
            return genericResponse;
        }
        return genericResponse;
    }

    // ----------------------------------
    // Reset Password
    // ----------------------------------
    async resetPassword(dto: ResetPasswordDto) {
        const user = await this.prisma.user.findUnique({
            where: { email: dto.email },
        });

        if (!user || user.status !== 'ACTIVE') {
            throw new BadRequestException('Invalid or expired OTP');
        }

        const otpRecord = await this.prisma.passwordResetOtp.findFirst({
            where: {
                userId: user.id,
                usedAt: null,
                expiresAt: { gt: new Date() },
                attempts: { lt: MAX_OTP_ATTEMPTS },
            },
            orderBy: {
                createdAt: 'desc',
            },
        });
        console.log("1. Found OTP Record:", otpRecord);
        console.log("2. Raw OTP from DTO:", dto.otp);

        if (!otpRecord) {
            throw new BadRequestException('Invalid or expired OTP');
        }

        const submittedHash = this.hashOtp(dto.otp);
        console.log("3. Submitted Hash:", submittedHash);
        console.log("4. DB Stored Hash:", otpRecord.otpHash);
        console.log("5. Are hashes identical?:", submittedHash === otpRecord.otpHash);

        if (!this.isSameHash(submittedHash, otpRecord.otpHash)) {
        await this.prisma.passwordResetOtp.updateMany({
            where: {
                id: otpRecord.id,
                usedAt: null,
            },
            data: {
                attempts: { increment: 1 },
            },
        });

        throw new BadRequestException('Invalid or expired OTP');
        }

        const passwordHash = await bcrypt.hash(dto.newPassword, 12);

        await this.prisma.$transaction(async (tx) => {
        const consumed = await tx.passwordResetOtp.updateMany({
            where: {
                id: otpRecord.id,
                usedAt: null,
                expiresAt: { gt: new Date() },
                attempts: { lt: MAX_OTP_ATTEMPTS },
            },
            data: {
                usedAt: new Date(),
            },
        });

        if (consumed.count !== 1) {
            throw new BadRequestException('Invalid or expired OTP');
        }

        await tx.user.update({
            where: { id: user.id },
            data: { passwordHash },
        });

        // Revoke all sessions after password reset.
        await tx.refreshSession.updateMany({
            where: {
                userId: user.id,
                revokedAt: null,
            },
            data: {
                revokedAt: new Date(),
            },
        });

        // Invalidate any other outstanding reset codes.
        await tx.passwordResetOtp.updateMany({
            where: {
                userId: user.id,
                usedAt: null,
            },
            data: {
                usedAt: new Date(),
            },
        });
        });

        return {
        message:
            'Password reset successfully. Please log in using your new password.',
        };
    }
}