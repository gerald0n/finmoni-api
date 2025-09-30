import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    UseGuards,
    Request,
    Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { TransactionsService } from './transactions.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Transactions')
@ApiBearerAuth()
@Controller('workspaces/:workspaceId/transactions')
@UseGuards(JwtAuthGuard)
export class TransactionsController {
    constructor(private readonly transactionsService: TransactionsService) { }

    @Post()
    @ApiOperation({
        summary: 'Criar transação',
        description: 'Cria uma nova transação financeira no workspace. A transação deve estar associada a uma conta bancária existente no workspace. O valor deve ser informado como string (ex: "150.75") e será convertido para centavos internamente.'
    })
    @ApiResponse({ status: 201, description: 'Transação criada com sucesso' })
    @ApiResponse({ status: 403, description: 'Usuário não é membro do workspace' })
    @ApiResponse({ status: 404, description: 'Conta bancária não encontrada no workspace' })
    create(
        @Param('workspaceId') workspaceId: string,
        @Body() createTransactionDto: CreateTransactionDto,
        @Request() req: any,
    ) {
        return this.transactionsService.create(workspaceId, createTransactionDto, req.user.sub);
    }

    @Get()
    @ApiOperation({
        summary: 'Listar transações do workspace',
        description: 'Lista todas as transações do workspace, com opção de filtrar por conta bancária. Mostra informações da conta bancária e do usuário que criou cada transação.'
    })
    @ApiQuery({
        name: 'bankAccountId',
        required: false,
        description: 'ID da conta bancária para filtrar as transações',
    })
    @ApiResponse({ status: 200, description: 'Lista de transações com informações da conta e criador' })
    list(
        @Param('workspaceId') workspaceId: string,
        @Request() req: any,
        @Query('bankAccountId') bankAccountId?: string,
    ) {
        return this.transactionsService.list(workspaceId, req.user.sub, bankAccountId);
    }

    @Get(':transactionId')
    @ApiOperation({
        summary: 'Obter detalhes de uma transação',
        description: 'Obtém os detalhes de uma transação específica, incluindo informações da conta bancária e do criador.'
    })
    @ApiResponse({ status: 200, description: 'Detalhes da transação' })
    @ApiResponse({ status: 404, description: 'Transação não encontrada' })
    getOne(
        @Param('workspaceId') workspaceId: string,
        @Param('transactionId') transactionId: string,
        @Request() req: any,
    ) {
        return this.transactionsService.getOne(workspaceId, transactionId, req.user.sub);
    }

    @Patch(':transactionId')
    @ApiOperation({
        summary: 'Atualizar transação',
        description: 'Atualiza os dados de uma transação. O valor deve ser informado como string e será convertido para centavos. Se a conta bancária for alterada, ela deve existir no workspace.'
    })
    @ApiResponse({ status: 200, description: 'Transação atualizada com sucesso' })
    @ApiResponse({ status: 404, description: 'Transação ou conta bancária não encontrada' })
    update(
        @Param('workspaceId') workspaceId: string,
        @Param('transactionId') transactionId: string,
        @Body() updateTransactionDto: UpdateTransactionDto,
        @Request() req: any,
    ) {
        return this.transactionsService.update(workspaceId, transactionId, updateTransactionDto, req.user.sub);
    }

    @Delete(':transactionId')
    @ApiOperation({ summary: 'Remover transação' })
    @ApiResponse({ status: 200, description: 'Transação removida com sucesso' })
    @ApiResponse({ status: 404, description: 'Transação não encontrada' })
    remove(
        @Param('workspaceId') workspaceId: string,
        @Param('transactionId') transactionId: string,
        @Request() req: any,
    ) {
        return this.transactionsService.remove(workspaceId, transactionId, req.user.sub);
    }
}