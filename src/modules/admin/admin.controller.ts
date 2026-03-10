import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles, Role } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { JwtPayload } from '../../common/strategy/jwt.strategy';

@ApiTags('Admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard) // ✅ JwtAuthGuard first, then RolesGuard
@Controller('admin')
export class AdminController {
  @Get()
  @Roles(Role.Admin)
  @ApiOperation({ summary: 'Admin only route' })
  hello(@CurrentUser() user: JwtPayload & { id: string }) {
    return { message: `Hello admin, ${user.email}` };
  }
}
