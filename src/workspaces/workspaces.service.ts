import {
    BadRequestException,
    ConflictException,
    ForbiddenException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';
import { UpdateWorkspaceDto } from './dto/update-workspace.dto';
import { InviteMemberDto } from './dto/invite-member.dto';
import { UpdateMemberRoleDto } from './dto/update-member-role.dto';
import { WorkspaceRole, InviteStatus } from '@prisma/client';
import { randomBytes } from 'crypto';

@Injectable()
export class WorkspacesService {
    constructor(private readonly prisma: PrismaService) { }

    // Criar novo workspace
    async create(userId: string, createWorkspaceDto: CreateWorkspaceDto) {
        const { name, description } = createWorkspaceDto;

        const workspace = await this.prisma.workspace.create({
            data: {
                name,
                description,
                creatorId: userId,
                members: {
                    create: {
                        userId: userId,
                        role: WorkspaceRole.OWNER,
                    },
                },
            },
            include: {
                members: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                            },
                        },
                    },
                },
                creator: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
                _count: {
                    select: {
                        members: true,
                    },
                },
            },
        });

        return workspace;
    }

    // Listar workspaces do usuário
    async findAllByUser(userId: string) {
        const workspaces = await this.prisma.workspace.findMany({
            where: {
                members: {
                    some: {
                        userId: userId,
                    },
                },
            },
            include: {
                creator: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
                members: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                            },
                        },
                    },
                },
                _count: {
                    select: {
                        members: true,
                    },
                },
            },
            orderBy: {
                updatedAt: 'desc',
            },
        });

        // Adicionar o role do usuário atual em cada workspace
        return workspaces.map((workspace) => ({
            ...workspace,
            currentUserRole: workspace.members.find(
                (member) => member.userId === userId,
            )?.role,
        }));
    }

    // Buscar workspace por ID (com verificação de permissão)
    async findOne(workspaceId: string, userId: string) {
        const workspace = await this.prisma.workspace.findFirst({
            where: {
                id: workspaceId,
                members: {
                    some: {
                        userId: userId,
                    },
                },
            },
            include: {
                creator: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
                members: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                            },
                        },
                    },
                    orderBy: {
                        joinedAt: 'asc',
                    },
                },
                invites: {
                    where: {
                        status: InviteStatus.PENDING,
                        expiresAt: {
                            gt: new Date(),
                        },
                    },
                    include: {
                        sender: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                            },
                        },
                    },
                },
                _count: {
                    select: {
                        members: true,
                    },
                },
            },
        });

        if (!workspace) {
            throw new NotFoundException('Workspace not found or access denied');
        }

        return {
            ...workspace,
            currentUserRole: workspace.members.find(
                (member) => member.userId === userId,
            )?.role,
        };
    }

    // Atualizar workspace
    async update(
        workspaceId: string,
        userId: string,
        updateWorkspaceDto: UpdateWorkspaceDto,
    ) {
        // Verificar se o usuário tem permissão (OWNER ou ADMIN)
        await this.checkPermission(workspaceId, userId, [
            WorkspaceRole.OWNER,
            WorkspaceRole.ADMIN,
        ]);

        const workspace = await this.prisma.workspace.update({
            where: { id: workspaceId },
            data: updateWorkspaceDto,
            include: {
                creator: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
                _count: {
                    select: {
                        members: true,
                    },
                },
            },
        });

        return workspace;
    }

    // Deletar workspace
    async remove(workspaceId: string, userId: string) {
        // Apenas o OWNER pode deletar
        await this.checkPermission(workspaceId, userId, [WorkspaceRole.OWNER]);

        await this.prisma.workspace.delete({
            where: { id: workspaceId },
        });

        return { message: 'Workspace deleted successfully' };
    }

    // Convidar membro
    async inviteMember(
        workspaceId: string,
        userId: string,
        inviteMemberDto: InviteMemberDto,
    ) {
        // Verificar permissão (OWNER ou ADMIN)
        await this.checkPermission(workspaceId, userId, [
            WorkspaceRole.OWNER,
            WorkspaceRole.ADMIN,
        ]);

        const { email, role = WorkspaceRole.MEMBER, message } = inviteMemberDto;

        // Verificar se o usuário já é membro
        const existingMember = await this.prisma.workspaceMember.findFirst({
            where: {
                workspaceId,
                user: { email },
            },
        });

        if (existingMember) {
            throw new ConflictException('User is already a member of this workspace');
        }

        // Verificar se já existe um convite pendente
        const existingInvite = await this.prisma.workspaceInvite.findFirst({
            where: {
                workspaceId,
                email,
                status: InviteStatus.PENDING,
                expiresAt: {
                    gt: new Date(),
                },
            },
        });

        if (existingInvite) {
            throw new ConflictException('There is already a pending invite for this email');
        }

        // Gerar token único
        const token = randomBytes(32).toString('hex');

        // Criar convite (expira em 7 dias)
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);

        const invite = await this.prisma.workspaceInvite.create({
            data: {
                email,
                role,
                token,
                message,
                expiresAt,
                senderId: userId,
                workspaceId,
            },
            include: {
                sender: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
                workspace: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
        });

        return invite;
    }

    // Aceitar convite
    async acceptInvite(userId: string, token: string) {
        const invite = await this.prisma.workspaceInvite.findFirst({
            where: {
                token,
                status: InviteStatus.PENDING,
                expiresAt: {
                    gt: new Date(),
                },
            },
            include: {
                workspace: true,
            },
        });

        if (!invite) {
            throw new NotFoundException('Invalid or expired invite');
        }

        // Verificar se o usuário já é membro
        const existingMember = await this.prisma.workspaceMember.findFirst({
            where: {
                workspaceId: invite.workspaceId,
                userId,
            },
        });

        if (existingMember) {
            throw new ConflictException('You are already a member of this workspace');
        }

        // Transação: aceitar convite e adicionar membro
        const result = await this.prisma.$transaction(async (tx) => {
            // Marcar convite como aceito
            await tx.workspaceInvite.update({
                where: { id: invite.id },
                data: {
                    status: InviteStatus.ACCEPTED,
                    acceptedAt: new Date(),
                    acceptedById: userId,
                },
            });

            // Adicionar como membro
            const member = await tx.workspaceMember.create({
                data: {
                    userId,
                    workspaceId: invite.workspaceId,
                    role: invite.role,
                },
                include: {
                    workspace: {
                        select: {
                            id: true,
                            name: true,
                            description: true,
                        },
                    },
                    user: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                        },
                    },
                },
            });

            return member;
        });

        return result;
    }

    // Listar convites pendentes do usuário
    async getUserInvites(userId: string) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { email: true },
        });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        const invites = await this.prisma.workspaceInvite.findMany({
            where: {
                email: user.email,
                status: InviteStatus.PENDING,
                expiresAt: {
                    gt: new Date(),
                },
            },
            include: {
                workspace: {
                    select: {
                        id: true,
                        name: true,
                        description: true,
                    },
                },
                sender: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        return invites;
    }

    // Recusar convite
    async declineInvite(userId: string, token: string) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { email: true },
        });

        const invite = await this.prisma.workspaceInvite.findFirst({
            where: {
                token,
                email: user?.email,
                status: InviteStatus.PENDING,
                expiresAt: {
                    gt: new Date(),
                },
            },
        });

        if (!invite) {
            throw new NotFoundException('Invalid or expired invite');
        }

        await this.prisma.workspaceInvite.update({
            where: { id: invite.id },
            data: {
                status: InviteStatus.DECLINED,
            },
        });

        return { message: 'Invite declined successfully' };
    }

    // Atualizar role de membro
    async updateMemberRole(
        workspaceId: string,
        userId: string,
        memberId: string,
        updateMemberRoleDto: UpdateMemberRoleDto,
    ) {
        // Verificar permissão (OWNER ou ADMIN)
        const userMember = await this.checkPermission(workspaceId, userId, [
            WorkspaceRole.OWNER,
            WorkspaceRole.ADMIN,
        ]);

        const { role } = updateMemberRoleDto;

        // Verificar se o membro existe
        const targetMember = await this.prisma.workspaceMember.findFirst({
            where: {
                id: memberId,
                workspaceId,
            },
        });

        if (!targetMember) {
            throw new NotFoundException('Member not found');
        }

        // Não permitir que ADMIN altere role do OWNER ou de outro ADMIN
        if (
            userMember.role === WorkspaceRole.ADMIN &&
            (targetMember.role === WorkspaceRole.OWNER ||
                targetMember.role === WorkspaceRole.ADMIN)
        ) {
            throw new ForbiddenException(
                'Administrators cannot modify roles of owners or other administrators',
            );
        }

        // Não permitir remover o último OWNER
        if (targetMember.role === WorkspaceRole.OWNER && role !== WorkspaceRole.OWNER) {
            const ownerCount = await this.prisma.workspaceMember.count({
                where: {
                    workspaceId,
                    role: WorkspaceRole.OWNER,
                },
            });

            if (ownerCount <= 1) {
                throw new BadRequestException(
                    'Cannot remove the last owner of the workspace',
                );
            }
        }

        const updatedMember = await this.prisma.workspaceMember.update({
            where: { id: memberId },
            data: { role },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
        });

        return updatedMember;
    }

    // Remover membro
    async removeMember(workspaceId: string, userId: string, memberId: string) {
        // Verificar permissão (OWNER ou ADMIN)
        const userMember = await this.checkPermission(workspaceId, userId, [
            WorkspaceRole.OWNER,
            WorkspaceRole.ADMIN,
        ]);

        const targetMember = await this.prisma.workspaceMember.findFirst({
            where: {
                id: memberId,
                workspaceId,
            },
        });

        if (!targetMember) {
            throw new NotFoundException('Member not found');
        }

        // Não permitir que ADMIN remova OWNER ou outro ADMIN
        if (
            userMember.role === WorkspaceRole.ADMIN &&
            (targetMember.role === WorkspaceRole.OWNER ||
                targetMember.role === WorkspaceRole.ADMIN)
        ) {
            throw new ForbiddenException(
                'Administrators cannot remove owners or other administrators',
            );
        }

        // Não permitir remover o último OWNER
        if (targetMember.role === WorkspaceRole.OWNER) {
            const ownerCount = await this.prisma.workspaceMember.count({
                where: {
                    workspaceId,
                    role: WorkspaceRole.OWNER,
                },
            });

            if (ownerCount <= 1) {
                throw new BadRequestException(
                    'Cannot remove the last owner of the workspace',
                );
            }
        }

        await this.prisma.workspaceMember.delete({
            where: { id: memberId },
        });

        return { message: 'Member removed successfully' };
    }

    // Sair do workspace
    async leaveWorkspace(workspaceId: string, userId: string) {
        const member = await this.prisma.workspaceMember.findFirst({
            where: {
                workspaceId,
                userId,
            },
        });

        if (!member) {
            throw new NotFoundException('You are not a member of this workspace');
        }

        // Não permitir que o último OWNER saia
        if (member.role === WorkspaceRole.OWNER) {
            const ownerCount = await this.prisma.workspaceMember.count({
                where: {
                    workspaceId,
                    role: WorkspaceRole.OWNER,
                },
            });

            if (ownerCount <= 1) {
                throw new BadRequestException(
                    'Cannot leave workspace as the last owner. Transfer ownership first.',
                );
            }
        }

        await this.prisma.workspaceMember.delete({
            where: { id: member.id },
        });

        return { message: 'Left workspace successfully' };
    }

    // Método auxiliar para verificar permissões
    private async checkPermission(
        workspaceId: string,
        userId: string,
        allowedRoles: WorkspaceRole[],
    ) {
        const member = await this.prisma.workspaceMember.findFirst({
            where: {
                workspaceId,
                userId,
            },
        });

        if (!member) {
            throw new NotFoundException('Workspace not found or access denied');
        }

        if (!allowedRoles.includes(member.role)) {
            throw new ForbiddenException('Insufficient permissions');
        }

        return member;
    }
}