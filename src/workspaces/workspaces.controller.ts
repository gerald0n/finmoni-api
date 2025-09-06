// src/workspaces/workspaces.controller.ts
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
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { WorkspacesService } from './workspaces.service';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';
import { UpdateWorkspaceDto } from './dto/update-workspace.dto';
import { InviteMemberDto } from './dto/invite-member.dto';
import { UpdateMemberRoleDto } from './dto/update-member-role.dto';
import { AcceptInviteDto } from './dto/accept-invite.dto';

@Controller('workspaces')
@UseGuards(JwtAuthGuard)
export class WorkspacesController {
    constructor(private readonly workspacesService: WorkspacesService) { }

    // Criar workspace
    @Post()
    create(@Request() req: any, @Body() createWorkspaceDto: CreateWorkspaceDto) {
        return this.workspacesService.create(req.user.id, createWorkspaceDto);
    }

    // Listar workspaces do usuário
    @Get()
    findAll(@Request() req: any) {
        return this.workspacesService.findAllByUser(req.user.id);
    }

    // Buscar workspace específico
    @Get(':id')
    findOne(@Param('id') id: string, @Request() req: any) {
        return this.workspacesService.findOne(id, req.user.id);
    }

    // Atualizar workspace
    @Patch(':id')
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
    remove(@Param('id') id: string, @Request() req: any) {
        return this.workspacesService.remove(id, req.user.id);
    }

    // Convidar membro
    @Post(':id/invites')
    inviteMember(
        @Param('id') id: string,
        @Request() req: any,
        @Body() inviteMemberDto: InviteMemberDto,
    ) {
        return this.workspacesService.inviteMember(id, req.user.id, inviteMemberDto);
    }

    // Listar convites pendentes do usuário
    @Get('invites/pending')
    getUserInvites(@Request() req: any) {
        return this.workspacesService.getUserInvites(req.user.id);
    }

    // Aceitar convite
    @Post('invites/accept')
    acceptInvite(@Request() req: any, @Body() acceptInviteDto: AcceptInviteDto) {
        return this.workspacesService.acceptInvite(req.user.id, acceptInviteDto.token);
    }

    // Recusar convite
    @Post('invites/decline')
    @HttpCode(HttpStatus.NO_CONTENT)
    declineInvite(@Request() req: any, @Body() acceptInviteDto: AcceptInviteDto) {
        return this.workspacesService.declineInvite(req.user.id, acceptInviteDto.token);
    }

    // Atualizar role de membro
    @Patch(':id/members/:memberId')
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
    leaveWorkspace(@Param('id') id: string, @Request() req: any) {
        return this.workspacesService.leaveWorkspace(id, req.user.id);
    }
}