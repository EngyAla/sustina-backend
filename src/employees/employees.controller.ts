import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    ParseUUIDPipe,
    Patch,
    Post,
    Query,
    Req,
    UseGuards,
} from '@nestjs/common';

import { AuthGuard } from '@nestjs/passport';

import { EmployeesService } from './employees.service.js';

import { CreateEmployeeDto } from './dto/create-employee.dto.js';
import { UpdateEmployeeDto } from './dto/update-employee.dto.js';
import { QueryEmployeesDto } from './dto/query-employees.dto.js';

import { OrgAdminGuard } from './guards/org-admin.guard.js';

interface AuthenticatedRequest {
    user: {
        id: string;
        email: string;
        role: string;
        organizationId: string;
    };
}

@Controller('employees')
@UseGuards(AuthGuard('jwt'), OrgAdminGuard)
export class EmployeesController {
    constructor(
        private readonly employeesService: EmployeesService,
    ) {}

    // GET /api/employees
    @Get()
    findAll(
        @Req() req: AuthenticatedRequest,
        @Query() query: QueryEmployeesDto,
    ) {
        return this.employeesService.findAll(
        req.user.organizationId,
        query,
        );
    }

    // POST /api/employees
    @Post()
    create(
        @Req() req: AuthenticatedRequest,
        @Body() dto: CreateEmployeeDto,
    ) {
        return this.employeesService.create(
        req.user.organizationId,
        dto,
        );
    }

    // PATCH /api/employees/:id/deactivate
    @Patch(':id/deactivate')
    deactivate(
        @Param('id', ParseUUIDPipe) id: string,
        @Req() req: AuthenticatedRequest,
    ) {
        return this.employeesService.deactivate(
        id,
        req.user.organizationId,
        );
    }

    // PATCH /api/employees/:id/activate
    @Patch(':id/activate')
    activate(
        @Param('id', ParseUUIDPipe) id: string,
        @Req() req: AuthenticatedRequest,
    ) {
        return this.employeesService.activate(
        id,
        req.user.organizationId,
        );
    }

    // GET /api/employees/:id
    @Get(':id')
    findOne(
        @Param('id', ParseUUIDPipe) id: string,
        @Req() req: AuthenticatedRequest,
    ) {
        return this.employeesService.findOne(
        id,
        req.user.organizationId,
        );
    }

    // PATCH /api/employees/:id
    @Patch(':id')
    update(
        @Param('id', ParseUUIDPipe) id: string,
        @Req() req: AuthenticatedRequest,
        @Body() dto: UpdateEmployeeDto,
    ) {
        return this.employeesService.update(
        id,
        req.user.organizationId,
        dto,
        );
    }

    // DELETE /api/employees/:id
    @Delete(':id')
    remove(
        @Param('id', ParseUUIDPipe) id: string,
        @Req() req: AuthenticatedRequest,
    ) {
        return this.employeesService.remove(
        id,
        req.user.organizationId,
        );
    }
}
