import { IsEnum, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { WorkspaceRole } from '@prisma/client';

export class UpdateMemberRoleDto {
    @ApiProperty({
        description: 'Novo papel do membro',
        enum: WorkspaceRole,
        example: WorkspaceRole.ADMIN
    })
    @IsEnum(WorkspaceRole, {
        message: 'Role must be one of: OWNER, ADMIN, MEMBER, VIEWER'
    })
    @IsNotEmpty()
    role: WorkspaceRole;
}