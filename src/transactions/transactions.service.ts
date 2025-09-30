import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';

@Injectable()
export class TransactionsService {
    constructor(private prisma: PrismaService) { }

    async create(
        workspaceId: string,
        createTransactionDto: CreateTransactionDto,
        userId: string,
    ) {
        // Verificar se o usuário é membro do workspace
        await this.checkUserMembership(userId, workspaceId);

        // Verificar se a conta bancária existe e pertence ao workspace
        const bankAccount = await this.prisma.bankAccount.findFirst({
            where: {
                id: createTransactionDto.bankAccountId,
                workspaceId,
            },
        });

        if (!bankAccount) {
            throw new NotFoundException('Conta bancária não encontrada no workspace especificado');
        }

        const { title, description, amount, date, type, bankAccountId } = createTransactionDto;

        return this.prisma.transaction.create({
            data: {
                title,
                description,
                amountCents: this.toCents(amount),
                date: new Date(date),
                type,
                bankAccountId,
                createdById: userId,
            },
            include: {
                bankAccount: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                createdBy: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
        });
    }

    async list(workspaceId: string, userId: string, bankAccountId?: string) {
        await this.checkUserMembership(userId, workspaceId);

        const whereClause: any = {
            bankAccount: {
                workspaceId,
            },
        };

        if (bankAccountId) {
            // Verificar se a conta bancária existe no workspace
            const bankAccount = await this.prisma.bankAccount.findFirst({
                where: {
                    id: bankAccountId,
                    workspaceId,
                },
            });

            if (!bankAccount) {
                throw new NotFoundException('Conta bancária não encontrada no workspace especificado');
            }

            whereClause.bankAccountId = bankAccountId;
        }

        return this.prisma.transaction.findMany({
            where: whereClause,
            include: {
                bankAccount: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                createdBy: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
            orderBy: { date: 'desc' },
        });
    }

    async getOne(workspaceId: string, transactionId: string, userId: string) {
        await this.checkUserMembership(userId, workspaceId);

        const transaction = await this.prisma.transaction.findFirst({
            where: {
                id: transactionId,
                bankAccount: {
                    workspaceId,
                },
            },
            include: {
                bankAccount: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                createdBy: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
        });

        if (!transaction) {
            throw new NotFoundException('Transação não encontrada');
        }

        return transaction;
    }

    async update(
        workspaceId: string,
        transactionId: string,
        updateTransactionDto: UpdateTransactionDto,
        userId: string,
    ) {
        await this.checkUserMembership(userId, workspaceId);

        // Verificar se a transação existe no workspace
        const existingTransaction = await this.prisma.transaction.findFirst({
            where: {
                id: transactionId,
                bankAccount: {
                    workspaceId,
                },
            },
        });

        if (!existingTransaction) {
            throw new NotFoundException('Transação não encontrada');
        }

        // Se está mudando a conta bancária, verificar se a nova conta existe no workspace
        if (updateTransactionDto.bankAccountId) {
            const bankAccount = await this.prisma.bankAccount.findFirst({
                where: {
                    id: updateTransactionDto.bankAccountId,
                    workspaceId,
                },
            });

            if (!bankAccount) {
                throw new NotFoundException('Conta bancária não encontrada no workspace especificado');
            }
        }

        const { title, description, amount, date, type, bankAccountId } = updateTransactionDto;
        const updateData: any = {};

        if (title !== undefined) updateData.title = title;
        if (description !== undefined) updateData.description = description;
        if (amount !== undefined) updateData.amountCents = this.toCents(amount);
        if (date !== undefined) updateData.date = new Date(date);
        if (type !== undefined) updateData.type = type;
        if (bankAccountId !== undefined) updateData.bankAccountId = bankAccountId;

        return this.prisma.transaction.update({
            where: { id: transactionId },
            data: updateData,
            include: {
                bankAccount: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                createdBy: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
        });
    }

    async remove(workspaceId: string, transactionId: string, userId: string) {
        await this.checkUserMembership(userId, workspaceId);

        const transaction = await this.prisma.transaction.findFirst({
            where: {
                id: transactionId,
                bankAccount: {
                    workspaceId,
                },
            },
        });

        if (!transaction) {
            throw new NotFoundException('Transação não encontrada');
        }

        await this.prisma.transaction.delete({
            where: { id: transactionId },
        });

        return { message: 'Transação removida com sucesso' };
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
            throw new BadRequestException('Valor inválido para conversão');
        }

        return Math.round(numberValue * 100);
    }
}