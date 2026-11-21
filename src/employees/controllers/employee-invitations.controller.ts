import {
    Body,
    Controller,
    Post,
} from '@nestjs/common';
import { EmployeesService } from '../employees.service.js';
import { AcceptInvitationDto } from '../dto/accept-invitation.dto.js';


@Controller('employees')
export class EmployeeInvitationsController {
    constructor(
        private readonly employeesService: EmployeesService,
    ) {}

    @Post('accept-invitation')
    async acceptInvitation(
        @Body() acceptInvitationDto: AcceptInvitationDto,
    ) {
        return this.employeesService.acceptInvitation(
        acceptInvitationDto,
        );
    }
}