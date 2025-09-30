import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export enum TransactionType {
    INCOME = 'INCOME',
    EXPENSE = 'EXPENSE',
}

export class CreateTransactionDto {
    @ApiProperty({ description: 'Título da transação' })
    @IsString()
    @IsNotEmpty()
    title: string;

    @ApiPropertyOptional({ description: 'Descrição opcional da transação' })
    @IsOptional()
    @IsString()
    description?: string;

    @ApiProperty({
        description: 'Valor da transação (string decimal); será salvo em centavos',
        example: '150.75',
    })
    @IsString()
    @IsNotEmpty()
    amount: string;

    @ApiProperty({
        description: 'Data da transação no formato ISO 8601',
        example: '2024-09-29T10:30:00Z',
    })
    @IsDateString()
    date: string;

    @ApiProperty({
        description: 'Tipo da transação',
        enum: TransactionType,
        example: TransactionType.INCOME,
    })
    @IsEnum(TransactionType)
    type: TransactionType;

    @ApiProperty({ description: 'ID da conta bancária associada' })
    @IsUUID()
    @IsNotEmpty()
    bankAccountId: string;
}