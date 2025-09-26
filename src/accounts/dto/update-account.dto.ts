import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UpdateAccountDto {
    @ApiPropertyOptional({ description: 'Nome da conta bancária' })
    @IsOptional()
    @IsString()
    name?: string;

    @ApiPropertyOptional({ description: 'Saldo inicial (string decimal), será salvo em centavos' })
    @IsOptional()
    @IsString()
    initialBalance?: string;

    @ApiPropertyOptional({ description: 'Agência bancária' })
    @IsOptional()
    @IsString()
    agency?: string;

    @ApiPropertyOptional({ description: 'Número da conta' })
    @IsOptional()
    @IsString()
    account?: string;
}
