import {
  Controller,
  Get,
  Put,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CompanyService } from './company.service';
import { TenantGuard } from '../guards/tenant.guard';
import { RolesGuard } from '../guards/roles.guard';
import { User, CurrentUser } from '../decorators/user.decorator';
import { Roles } from '../decorators/roles.decorator';
import { 
  UpdateCompanyDto, 
  InviteMemberDto,
  UpdateMemberRoleDto,
  CompanyResponseDto,
  MemberResponseDto,
  updateCompanyDtoSchema,
  inviteMemberDtoSchema,
  updateMemberRoleDtoSchema,
} from '@saas/shared';
import { ZodValidationPipe } from '../pipes/zod-validation.pipe';

@ApiTags('companies')
@Controller('companies')
@UseGuards(AuthGuard('jwt'), TenantGuard)
@ApiBearerAuth()
export class CompanyController {
  constructor(private companyService: CompanyService) {}

  @Get('current')
  @ApiOperation({ summary: 'Get current company info' })
  @ApiResponse({ 
    status: 200, 
    description: 'Company information',
    type: CompanyResponseDto,
  })
  async getCurrentCompany(@User() user: CurrentUser) {
    return this.companyService.getCompany(user.companyId);
  }

  @Put('current')
  @UseGuards(RolesGuard)
  @Roles('OWNER', 'ADMIN')
  @ApiOperation({ summary: 'Update current company' })
  @ApiResponse({ 
    status: 200, 
    description: 'Company updated successfully',
    type: CompanyResponseDto,
  })
  async updateCurrentCompany(
    @Body(new ZodValidationPipe(updateCompanyDtoSchema)) updateCompanyDto: UpdateCompanyDto,
    @User() user: CurrentUser,
  ) {
    return this.companyService.updateCompany(
      user.companyId,
      updateCompanyDto,
      user.userId,
    );
  }

  @Get('members')
  @ApiOperation({ summary: 'Get company members' })
  @ApiResponse({ 
    status: 200, 
    description: 'Company members',
    type: [MemberResponseDto],
  })
  async getMembers(@User() user: CurrentUser) {
    return this.companyService.getMembers(user.companyId);
  }

  @Post('members/invite')
  @UseGuards(RolesGuard)
  @Roles('OWNER', 'ADMIN')
  @ApiOperation({ summary: 'Invite new member' })
  @ApiResponse({ status: 201, description: 'Invitation sent successfully' })
  async inviteMember(
    @Body(new ZodValidationPipe(inviteMemberDtoSchema)) inviteMemberDto: InviteMemberDto,
    @User() user: CurrentUser,
  ) {
    return this.companyService.inviteMember(
      user.companyId,
      inviteMemberDto,
      user.userId,
    );
  }

  @Put('members/:memberId/role')
  @UseGuards(RolesGuard)
  @Roles('OWNER', 'ADMIN')
  @ApiOperation({ summary: 'Update member role' })
  @ApiResponse({ 
    status: 200, 
    description: 'Member role updated successfully',
    type: MemberResponseDto,
  })
  async updateMemberRole(
    @Param('memberId') memberId: string,
    @Body(new ZodValidationPipe(updateMemberRoleDtoSchema)) updateMemberRoleDto: UpdateMemberRoleDto,
    @User() user: CurrentUser,
  ) {
    return this.companyService.updateMemberRole(
      user.companyId,
      memberId,
      updateMemberRoleDto,
      user.userId,
    );
  }

  @Delete('members/:memberId')
  @UseGuards(RolesGuard)
  @Roles('OWNER', 'ADMIN')
  @ApiOperation({ summary: 'Remove member' })
  @ApiResponse({ status: 200, description: 'Member removed successfully' })
  async removeMember(
    @Param('memberId') memberId: string,
    @User() user: CurrentUser,
  ) {
    return this.companyService.removeMember(
      user.companyId,
      memberId,
      user.userId,
    );
  }
}