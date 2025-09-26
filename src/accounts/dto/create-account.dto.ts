import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateAccountDto {
    @ApiProperty({ description: 'Nome da conta bancária' })
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiPropertyOptional({
        description: 'Saldo inicial da conta (string decimal); será salvo em centavos',
        example: '1000.50',
    })
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
