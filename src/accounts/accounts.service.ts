import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';

@Injectable()
export class AccountsService {
    constructor(private prisma: PrismaService) { }

    async create(
        workspaceId: string,
        createAccountDto: CreateAccountDto,
        userId: string,
    ) {
        await this.checkUserMembership(userId, workspaceId);

        const { name, initialBalance, agency, account } = createAccountDto;

        return this.prisma.bankAccount.create({
            data: {
                name,
                initialBalanceCents: initialBalance ? this.toCents(initialBalance) : null,
                agency,
                account,
                workspaceId,
                ownerId: userId
            },
            include: {
                owner: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
        });
    }

    async list(workspaceId: string, userId: string) {
        await this.checkUserMembership(userId, workspaceId);

        return this.prisma.bankAccount.findMany({
            where: { workspaceId },
            include: {
                owner: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    async getOne(workspaceId: string, accountId: string, userId: string) {
        await this.checkUserMembership(userId, workspaceId);

        const account = await this.prisma.bankAccount.findFirst({
            where: { id: accountId, workspaceId },
            include: {
                owner: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
        });

        if (!account) {
            throw new NotFoundException('Conta bancária não encontrada');
        }

        return account;
    }

    async update(
        workspaceId: string,
        accountId: string,
        updateAccountDto: UpdateAccountDto,
        userId: string,
    ) {
        await this.checkUserMembership(userId, workspaceId);

        const existingAccount = await this.prisma.bankAccount.findFirst({
            where: { id: accountId, workspaceId },
        });

        if (!existingAccount) {
            throw new NotFoundException('Conta bancária não encontrada');
        }

        const { name, initialBalance, agency, account } = updateAccountDto;
        const updateData: any = {};

        if (name !== undefined) updateData.name = name;
        if (initialBalance !== undefined) {
            updateData.initialBalanceCents = this.toCents(initialBalance);
        }
        if (agency !== undefined) updateData.agency = agency;
        if (account !== undefined) updateData.account = account;

        return this.prisma.bankAccount.update({
            where: { id: accountId },
            data: updateData,
            include: {
                owner: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
        });
    }

    async remove(workspaceId: string, accountId: string, userId: string) {
        await this.checkUserMembership(userId, workspaceId);

        const account = await this.prisma.bankAccount.findFirst({
            where: { id: accountId, workspaceId },
        });

        if (!account) {
            throw new NotFoundException('Conta bancária não encontrada');
        }

        await this.prisma.bankAccount.delete({
            where: { id: accountId },
        });

        return { message: 'Conta bancária removida com sucesso' };
    }

    private async checkUserMembership(userId: string, workspaceId: string) {
        const membership = await this.prisma.workspaceMember.findFirst({
            where: { userId, workspaceId },
        });

        if (!membership) {
            throw new ForbiddenException('Usuário não é membro do workspace');
        }
    }

    private toCents(value: string): number {
        const normalized = value.trim().replace(',', '.');

        const numberValue = parseFloat(normalized);

        if (isNaN(numberValue)) {
            throw new Error('Valor inválido para conversão');
        }

        return Math.round(numberValue * 100);
    }
}
