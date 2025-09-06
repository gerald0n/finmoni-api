import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { WorkspaceRole } from '@prisma/client';

export class InviteMemberDto {
    @IsEmail()
    @IsNotEmpty()
    email: string;

    @IsEnum(WorkspaceRole, {
        message: 'Role must be one of: OWNER, ADMIN, MEMBER, VIEWER'
    })
    @IsOptional()
    role?: WorkspaceRole = WorkspaceRole.MEMBER;

    @IsString()
    @IsOptional()
    @MaxLength(500, { message: 'Message cannot exceed 500 characters' })
    message?: string;
}