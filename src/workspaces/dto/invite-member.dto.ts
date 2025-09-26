import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { WorkspaceRole } from '@prisma/client';

export class InviteMemberDto {
  @ApiProperty({
    description: 'Email da pessoa a ser convidada',
    example: 'maria@email.com',
    format: 'email',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    description: 'Papel que será atribuído ao membro',
    enum: WorkspaceRole,
    example: WorkspaceRole.MEMBER,
    default: WorkspaceRole.MEMBER,
    required: false,
  })
  @IsEnum(WorkspaceRole, {
    message: 'Role must be one of: OWNER, ADMIN, MEMBER, VIEWER',
  })
  @IsOptional()
  role?: WorkspaceRole = WorkspaceRole.MEMBER;

  @ApiProperty({
    description: 'Mensagem personalizada do convite',
    example: 'Vem gerenciar as finanças comigo!',
    maxLength: 500,
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(500, { message: 'Message cannot exceed 500 characters' })
  message?: string;
}
