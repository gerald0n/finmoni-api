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
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AccountsService } from './accounts.service';
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Accounts')
@ApiBearerAuth()
@Controller('workspaces/:workspaceId/accounts')
@UseGuards(JwtAuthGuard)
export class AccountsController {
    constructor(private readonly accountsService: AccountsService) { }

    @Post()
    @ApiOperation({
        summary: 'Criar conta bancária',
        description: 'Cria uma nova conta bancária no workspace. O usuário autenticado será definido como proprietário da conta. O saldo inicial deve ser informado como string (ex: "1000.50") e será convertido para centavos internamente.'
    })
    @ApiResponse({ status: 201, description: 'Conta bancária criada com sucesso' })
    @ApiResponse({ status: 403, description: 'Usuário não é membro do workspace' })
    create(
        @Param('workspaceId') workspaceId: string,
        @Body() createAccountDto: CreateAccountDto,
        @Request() req: any,
    ) {
        return this.accountsService.create(workspaceId, createAccountDto, req.user.sub);
    }

    @Get()
    @ApiOperation({
        summary: 'Listar contas bancárias do workspace',
        description: 'Lista todas as contas bancárias do workspace, mostrando o proprietário de cada conta.'
    })
    @ApiResponse({ status: 200, description: 'Lista de contas bancárias com informações do proprietário' })
    list(@Param('workspaceId') workspaceId: string, @Request() req: any) {
        return this.accountsService.list(workspaceId, req.user.sub);
    }

    @Get(':accountId')
    @ApiOperation({
        summary: 'Obter detalhes de uma conta bancária',
        description: 'Obtém os detalhes de uma conta bancária específica, incluindo informações do proprietário.'
    })
    @ApiResponse({ status: 200, description: 'Detalhes da conta bancária' })
    @ApiResponse({ status: 404, description: 'Conta bancária não encontrada' })
    getOne(
        @Param('workspaceId') workspaceId: string,
        @Param('accountId') accountId: string,
        @Request() req: any,
    ) {
        return this.accountsService.getOne(workspaceId, accountId, req.user.sub);
    }

    @Patch(':accountId')
    @ApiOperation({
        summary: 'Atualizar conta bancária',
        description: 'Atualiza os dados de uma conta bancária. O saldo inicial deve ser informado como string e será convertido para centavos.'
    })
    @ApiResponse({ status: 200, description: 'Conta bancária atualizada com sucesso' })
    @ApiResponse({ status: 404, description: 'Conta bancária não encontrada' })
    update(
        @Param('workspaceId') workspaceId: string,
        @Param('accountId') accountId: string,
        @Body() updateAccountDto: UpdateAccountDto,
        @Request() req: any,
    ) {
        return this.accountsService.update(workspaceId, accountId, updateAccountDto, req.user.sub);
    }

    @Delete(':accountId')
    @ApiOperation({ summary: 'Remover conta bancária' })
    @ApiResponse({ status: 200, description: 'Conta bancária removida com sucesso' })
    @ApiResponse({ status: 404, description: 'Conta bancária não encontrada' })
    remove(
        @Param('workspaceId') workspaceId: string,
        @Param('accountId') accountId: string,
        @Request() req: any,
    ) {
        return this.accountsService.remove(workspaceId, accountId, req.user.sub);
    }
}
