import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateWorkspaceDto {
    @IsString()
    @IsNotEmpty()
    @MaxLength(100, { message: 'Workspace name cannot exceed 100 characters' })
    name: string;

    @IsString()
    @IsOptional()
    @MaxLength(500, { message: 'Description cannot exceed 500 characters' })
    description?: string;
}