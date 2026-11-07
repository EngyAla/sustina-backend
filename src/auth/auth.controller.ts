import {
    Body,
    Controller,
    Get,
    HttpCode,
    HttpStatus,
    Post,
    Req,
    Res,
    UseGuards,
} from '@nestjs/common';

import type { Request, Response } from 'express';
import { AuthService } from './auth.service.js';
import { LoginDto } from './dto/login.dto.js';
import { ForgotPasswordDto } from './dto/forgot-password.dto.js';
import { ResetPasswordDto } from './dto/reset-password.dto.js';
import { JwtAuthGuard } from './guards/jwt-auth.guard.js';

const REFRESH_COOKIE_NAME = 'sustina_refresh';

interface AuthenticatedRequest extends Request {
    user: {
        id: string;
        email: string;
        role: string;
        organizationId: string | null;
        organization: {
            id: string;
            legalName: string;
            status: string;
        } | null;
    };
}

@Controller('auth')
export class AuthController {
    constructor(
        private readonly authService: AuthService,
    ) {}

    private cookieOptions() {
        const isProduction = process.env.NODE_ENV === 'production';

        return {
        httpOnly: true,
        secure: isProduction,
        sameSite: 'lax' as const,
        path: '/api/auth',
        maxAge: 7 * 24 * 60 * 60 * 1000,
        };
    }


    @Post('login')
    async login(
        @Body() dto: LoginDto,
        @Res({ passthrough: true }) response: Response,
    ) {
        const result = await this.authService.login(dto);

        response.cookie(
            REFRESH_COOKIE_NAME,
            result.refreshToken,
            this.cookieOptions(),
        );

        const { refreshToken, ...safeResult } = result;

        return safeResult;
    }

    @Post('refresh')
    async refresh(
        @Req() request: Request,
        @Res({ passthrough: true }) response: Response,
    ) {
        const refreshToken = request.cookies?.[REFRESH_COOKIE_NAME];

        const result = await this.authService.refresh(refreshToken);

        response.cookie(
        REFRESH_COOKIE_NAME,
        result.refreshToken,
        this.cookieOptions(),
        );

        const { refreshToken: newRefreshToken, ...safeResult } = result;

        return safeResult;
    }

    @Post('logout')
    async logout(
        @Req() request: Request,
        @Res({ passthrough: true }) response: Response,
    ) {
        const refreshToken = request.cookies?.[REFRESH_COOKIE_NAME];

        const result = await this.authService.logout(refreshToken);

        response.clearCookie(
        REFRESH_COOKIE_NAME,
        this.cookieOptions(),
        );

        return result;
    }

    @Post('forgot-password')
    forgotPassword(@Body() dto: ForgotPasswordDto) {
        return this.authService.forgotPassword(dto);
    }

    @Post('reset-password')
    resetPassword(@Body() dto: ResetPasswordDto) {
        return this.authService.resetPassword(dto);
    }

    @Get('me')
    @UseGuards(JwtAuthGuard)
    getProfile(@Req() request: AuthenticatedRequest) {
        return {
        user: request.user,
        };
    }
}