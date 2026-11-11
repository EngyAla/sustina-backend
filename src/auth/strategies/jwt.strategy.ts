import {
    Injectable,
    UnauthorizedException,
} from '@nestjs/common';

import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

import { PrismaService } from '../../prisma/prisma.service.js';

interface JwtPayload {
    sub: string;
    email: string;
    role: string;
    organizationId: string | null;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(
        configService: ConfigService,
        private readonly prisma: PrismaService,
    ) {
        super({
        jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
        ignoreExpiration: false,
        secretOrKey: configService.getOrThrow<string>(
            'JWT_ACCESS_SECRET',
        ),
        });
    }

    async validate(payload: JwtPayload) {
        // Find the current user in the database
        const user = await this.prisma.user.findUnique({
            where: {
                id: payload.sub,
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

        if (!user || user.deletedAt !== null || user.status !== 'ACTIVE') {
            throw new UnauthorizedException(
                'User account is not active or does not exist',
            );
        }

        // Validate organization status for tenant users
        if (user.role !== 'SUPER_ADMIN') {
            if (
                !user.organization ||
                user.organization.status !== 'ACTIVE'
            ) {
                throw new UnauthorizedException(
                'Organization is not active',
                );
            }
        }

        // Return current database data, not untrusted client data
        return {
            id: user.id,
            email: user.email,
            role: user.role,
            organizationId: user.organizationId,
            organization: user.organization,
        };
    }
}