import { IsEnum, IsNotEmpty } from 'class-validator';
import { WorkspaceRole } from '@prisma/client';

export class UpdateMemberRoleDto {
    @IsEnum(WorkspaceRole, {
        message: 'Role must be one of: OWNER, ADMIN, MEMBER, VIEWER'
    })
    @IsNotEmpty()
    role: WorkspaceRole;
}