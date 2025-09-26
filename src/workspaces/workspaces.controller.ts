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
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiForbiddenResponse,
  ApiConflictResponse,
  ApiNoContentResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { WorkspacesService } from './workspaces.service';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';
import { UpdateWorkspaceDto } from './dto/update-workspace.dto';
import { InviteMemberDto } from './dto/invite-member.dto';
import { UpdateMemberRoleDto } from './dto/update-member-role.dto';
import { AcceptInviteDto } from './dto/accept-invite.dto';

@ApiTags('Workspaces')
@Controller('workspaces')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class WorkspacesController {
  constructor(private readonly workspacesService: WorkspacesService) {}

  // Criar workspace
  @Post()
  @ApiOperation({
    summary: 'Criar workspace',
    description: 'Cria um novo workspace e adiciona o usuário como OWNER',
  })
  @ApiResponse({
    status: 201,
    description: 'Workspace criado com sucesso',
    schema: {
      example: {
        id: 'workspace-123',
        name: 'Finanças da Família',
        description: 'Controle financeiro compartilhado',
        creatorId: 'user-123',
        createdAt: '2024-01-15T10:30:00.000Z',
        updatedAt: '2024-01-15T10:30:00.000Z',
        creator: {
          id: 'user-123',
          name: 'João Silva',
          email: 'joao@email.com',
        },
        members: [
          {
            id: 'member-123',
            role: 'OWNER',
            userId: 'user-123',
            user: {
              id: 'user-123',
              name: 'João Silva',
              email: 'joao@email.com',
            },
          },
        ],
        _count: { members: 1 },
      },
    },
  })
  create(@Request() req: any, @Body() createWorkspaceDto: CreateWorkspaceDto) {
    return this.workspacesService.create(req.user.id, createWorkspaceDto);
  }

  // Listar workspaces do usuário
  @Get()
  @ApiOperation({
    summary: 'Listar meus workspaces',
    description: 'Retorna todos os workspaces dos quais o usuário é membro',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de workspaces',
    schema: {
      example: [
        {
          id: 'workspace-123',
          name: 'Finanças da Família',
          description: 'Controle financeiro compartilhado',
          currentUserRole: 'OWNER',
          creator: {
            id: 'user-123',
            name: 'João Silva',
            email: 'joao@email.com',
          },
          _count: { members: 2 },
        },
      ],
    },
  })
  findAll(@Request() req: any) {
    return this.workspacesService.findAllByUser(req.user.id);
  }

  // Buscar workspace específico
  @Get(':id')
  @ApiOperation({
    summary: 'Ver detalhes do workspace',
    description: 'Retorna detalhes completos de um workspace específico',
  })
  @ApiParam({ name: 'id', description: 'ID do workspace' })
  @ApiResponse({
    status: 200,
    description: 'Detalhes do workspace',
    schema: {
      example: {
        id: 'workspace-123',
        name: 'Finanças da Família',
        description: 'Controle financeiro compartilhado',
        currentUserRole: 'OWNER',
        members: [
          {
            id: 'member-123',
            role: 'OWNER',
            joinedAt: '2024-01-15T10:30:00.000Z',
            user: {
              id: 'user-123',
              name: 'João Silva',
              email: 'joao@email.com',
            },
          },
        ],
        invites: [
          {
            id: 'invite-123',
            email: 'maria@email.com',
            role: 'MEMBER',
            status: 'PENDING',
            sender: {
              id: 'user-123',
              name: 'João Silva',
              email: 'joao@email.com',
            },
          },
        ],
      },
    },
  })
  @ApiNotFoundResponse({
    description: 'Workspace não encontrado ou sem acesso',
  })
  findOne(@Param('id') id: string, @Request() req: any) {
    return this.workspacesService.findOne(id, req.user.id);
  }

  // Atualizar workspace
  @Patch(':id')
  @ApiOperation({
    summary: 'Atualizar workspace',
    description: 'Atualiza informações do workspace (apenas OWNER ou ADMIN)',
  })
  @ApiParam({ name: 'id', description: 'ID do workspace' })
  @ApiResponse({ status: 200, description: 'Workspace atualizado com sucesso' })
  @ApiNotFoundResponse({ description: 'Workspace não encontrado' })
  @ApiForbiddenResponse({ description: 'Permissão insuficiente' })
  update(
    @Param('id') id: string,
    @Request() req: any,
    @Body() updateWorkspaceDto: UpdateWorkspaceDto,
  ) {
    return this.workspacesService.update(id, req.user.id, updateWorkspaceDto);
  }

  // Deletar workspace
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Deletar workspace',
    description: 'Deleta completamente um workspace (apenas OWNER)',
  })
  @ApiParam({ name: 'id', description: 'ID do workspace' })
  @ApiNoContentResponse({ description: 'Workspace deletado com sucesso' })
  @ApiNotFoundResponse({ description: 'Workspace não encontrado' })
  @ApiForbiddenResponse({
    description: 'Apenas o OWNER pode deletar o workspace',
  })
  remove(@Param('id') id: string, @Request() req: any) {
    return this.workspacesService.remove(id, req.user.id);
  }

  // Convidar membro
  @Post(':id/invites')
  @ApiTags('Invites')
  @ApiOperation({
    summary: 'Convidar membro',
    description:
      'Convida uma pessoa para o workspace via email (OWNER ou ADMIN)',
  })
  @ApiParam({ name: 'id', description: 'ID do workspace' })
  @ApiResponse({
    status: 201,
    description: 'Convite enviado com sucesso',
    schema: {
      example: {
        id: 'invite-123',
        email: 'maria@email.com',
        role: 'MEMBER',
        status: 'PENDING',
        token: 'abc123...',
        message: 'Vem gerenciar as finanças comigo!',
        expiresAt: '2024-01-22T10:30:00.000Z',
        sender: {
          id: 'user-123',
          name: 'João Silva',
          email: 'joao@email.com',
        },
        workspace: {
          id: 'workspace-123',
          name: 'Finanças da Família',
        },
      },
    },
  })
  @ApiConflictResponse({
    description: 'Usuário já é membro ou já possui convite pendente',
  })
  @ApiForbiddenResponse({ description: 'Apenas OWNER ou ADMIN podem convidar' })
  inviteMember(
    @Param('id') id: string,
    @Request() req: any,
    @Body() inviteMemberDto: InviteMemberDto,
  ) {
    return this.workspacesService.inviteMember(
      id,
      req.user.id,
      inviteMemberDto,
    );
  }

  // Listar convites pendentes do usuário
  @Get('invites/pending')
  @ApiTags('Invites')
  @ApiOperation({
    summary: 'Meus convites pendentes',
    description: 'Lista todos os convites pendentes para o usuário logado',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de convites pendentes',
    schema: {
      example: [
        {
          id: 'invite-123',
          email: 'maria@email.com',
          role: 'MEMBER',
          status: 'PENDING',
          token: 'abc123...',
          message: 'Vem gerenciar as finanças comigo!',
          expiresAt: '2024-01-22T10:30:00.000Z',
          workspace: {
            id: 'workspace-123',
            name: 'Finanças da Família',
            description: 'Controle financeiro compartilhado',
          },
          sender: {
            id: 'user-123',
            name: 'João Silva',
            email: 'joao@email.com',
          },
        },
      ],
    },
  })
  getUserInvites(@Request() req: any) {
    return this.workspacesService.getUserInvites(req.user.id);
  }

  // Aceitar convite
  @Post('invites/accept')
  @ApiTags('Invites')
  @ApiOperation({
    summary: 'Aceitar convite',
    description:
      'Aceita um convite pendente e adiciona o usuário como membro do workspace',
  })
  @ApiResponse({
    status: 201,
    description: 'Convite aceito, usuário adicionado ao workspace',
    schema: {
      example: {
        id: 'member-456',
        role: 'MEMBER',
        userId: 'user-456',
        workspaceId: 'workspace-123',
        joinedAt: '2024-01-15T11:00:00.000Z',
        workspace: {
          id: 'workspace-123',
          name: 'Finanças da Família',
          description: 'Controle financeiro compartilhado',
        },
        user: {
          id: 'user-456',
          name: 'Maria Silva',
          email: 'maria@email.com',
        },
      },
    },
  })
  @ApiNotFoundResponse({ description: 'Convite inválido ou expirado' })
  @ApiConflictResponse({ description: 'Usuário já é membro do workspace' })
  acceptInvite(@Request() req: any, @Body() acceptInviteDto: AcceptInviteDto) {
    return this.workspacesService.acceptInvite(
      req.user.id,
      acceptInviteDto.token,
    );
  }

  // Recusar convite
  @Post('invites/decline')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiTags('Invites')
  @ApiOperation({
    summary: 'Recusar convite',
    description: 'Recusa um convite pendente',
  })
  @ApiNoContentResponse({ description: 'Convite recusado com sucesso' })
  @ApiNotFoundResponse({ description: 'Convite inválido ou expirado' })
  declineInvite(@Request() req: any, @Body() acceptInviteDto: AcceptInviteDto) {
    return this.workspacesService.declineInvite(
      req.user.id,
      acceptInviteDto.token,
    );
  }

  // Atualizar role de membro
  @Patch(':id/members/:memberId')
  @ApiTags('Members')
  @ApiOperation({
    summary: 'Alterar role de membro',
    description: 'Altera o papel/permissão de um membro (OWNER ou ADMIN)',
  })
  @ApiParam({ name: 'id', description: 'ID do workspace' })
  @ApiParam({ name: 'memberId', description: 'ID do membro' })
  @ApiResponse({
    status: 200,
    description: 'Role do membro alterado com sucesso',
    schema: {
      example: {
        id: 'member-456',
        role: 'ADMIN',
        joinedAt: '2024-01-15T11:00:00.000Z',
        updatedAt: '2024-01-15T12:00:00.000Z',
        user: {
          id: 'user-456',
          name: 'Maria Silva',
          email: 'maria@email.com',
        },
      },
    },
  })
  @ApiNotFoundResponse({ description: 'Workspace ou membro não encontrado' })
  @ApiForbiddenResponse({ description: 'Permissão insuficiente' })
  @ApiBadRequestResponse({
    description: 'Não é possível remover o último OWNER',
  })
  updateMemberRole(
    @Param('id') id: string,
    @Param('memberId') memberId: string,
    @Request() req: any,
    @Body() updateMemberRoleDto: UpdateMemberRoleDto,
  ) {
    return this.workspacesService.updateMemberRole(
      id,
      req.user.id,
      memberId,
      updateMemberRoleDto,
    );
  }

  // Remover membro
  @Delete(':id/members/:memberId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiTags('Members')
  @ApiOperation({
    summary: 'Remover membro',
    description: 'Remove um membro do workspace (OWNER ou ADMIN)',
  })
  @ApiParam({ name: 'id', description: 'ID do workspace' })
  @ApiParam({ name: 'memberId', description: 'ID do membro' })
  @ApiNoContentResponse({ description: 'Membro removido com sucesso' })
  @ApiNotFoundResponse({ description: 'Workspace ou membro não encontrado' })
  @ApiForbiddenResponse({ description: 'Permissão insuficiente' })
  @ApiBadRequestResponse({
    description: 'Não é possível remover o último OWNER',
  })
  removeMember(
    @Param('id') id: string,
    @Param('memberId') memberId: string,
    @Request() req: any,
  ) {
    return this.workspacesService.removeMember(id, req.user.id, memberId);
  }

  // Sair do workspace
  @Delete(':id/leave')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiTags('Members')
  @ApiOperation({
    summary: 'Sair do workspace',
    description: 'Remove o usuário atual do workspace',
  })
  @ApiParam({ name: 'id', description: 'ID do workspace' })
  @ApiNoContentResponse({ description: 'Saiu do workspace com sucesso' })
  @ApiNotFoundResponse({ description: 'Usuário não é membro do workspace' })
  @ApiBadRequestResponse({
    description:
      'Último OWNER não pode sair. Transfira a propriedade primeiro.',
  })
  leaveWorkspace(@Param('id') id: string, @Request() req: any) {
    return this.workspacesService.leaveWorkspace(id, req.user.id);
  }
}
