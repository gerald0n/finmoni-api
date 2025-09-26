import { Body, Controller, Delete, Get, Param, Patch, Post, Request, UseGuards } from '@nestjs/common';
import {
    ApiBearerAuth,
    ApiCreatedResponse,
    ApiOperation,
    ApiParam,
    ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AccountsService } from './accounts.service';
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';
import { Request as ExpressRequest } from 'express';

@ApiTags('Accounts')
@Controller('workspaces/:workspaceId/accounts')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class AccountsController {
    constructor(private readonly accountsService: AccountsService) { }

    @Get()
    @ApiOperation({ summary: 'Listar contas do workspace' })
    @ApiParam({ name: 'workspaceId', description: 'ID do workspace' })
    list(
        @Param('workspaceId') workspaceId: string,
        @Request() req: ExpressRequest & { user: { id: string } },
    ) {
        return this.accountsService.list(workspaceId, req.user.id);
    }

    @Get(':accountId')
    @ApiOperation({ summary: 'Detalhar conta do workspace' })
    @ApiParam({ name: 'workspaceId', description: 'ID do workspace' })
    @ApiParam({ name: 'accountId', description: 'ID da conta' })
    getOne(
        @Param('workspaceId') workspaceId: string,
        @Param('accountId') accountId: string,
        @Request() req: ExpressRequest & { user: { id: string } },
    ) {
        return this.accountsService.getOne(workspaceId, accountId, req.user.id);
    }

    @Post()
    @ApiOperation({
        summary: 'Criar conta bancária',
        description: 'Cria uma conta bancária dentro do workspace informado',
    })
    @ApiParam({ name: 'workspaceId', description: 'ID do workspace' })
    @ApiCreatedResponse({ description: 'Conta criada com sucesso' })
    create(
        @Param('workspaceId') workspaceId: string,
        @Request() req: ExpressRequest & { user: { id: string } },
        @Body() dto: CreateAccountDto,
    ) {
        return this.accountsService.create(workspaceId, req.user.id, dto);
    }

    @Patch(':accountId')
    @ApiOperation({ summary: 'Atualizar conta bancária' })
    @ApiParam({ name: 'workspaceId', description: 'ID do workspace' })
    @ApiParam({ name: 'accountId', description: 'ID da conta' })
    update(
        @Param('workspaceId') workspaceId: string,
        @Param('accountId') accountId: string,
        @Request() req: ExpressRequest & { user: { id: string } },
        @Body() dto: UpdateAccountDto,
    ) {
        return this.accountsService.update(workspaceId, accountId, req.user.id, dto);
    }

    @Delete(':accountId')
    @ApiOperation({ summary: 'Remover conta bancária' })
    @ApiParam({ name: 'workspaceId', description: 'ID do workspace' })
    @ApiParam({ name: 'accountId', description: 'ID da conta' })
    remove(
        @Param('workspaceId') workspaceId: string,
        @Param('accountId') accountId: string,
        @Request() req: ExpressRequest & { user: { id: string } },
    ) {
        return this.accountsService.remove(workspaceId, accountId, req.user.id);
    }
}
