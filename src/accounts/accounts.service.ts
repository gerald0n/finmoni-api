import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';

@Injectable()
export class AccountsService {
    constructor(private readonly prisma: PrismaService) { }

    // Cria uma conta bancária no workspace, garantindo que o usuário é membro
    async create(workspaceId: string, userId: string, dto: CreateAccountDto) {
        // Verifica se o usuário é membro do workspace
        const member = await this.prisma.workspaceMember.findFirst({
            where: { workspaceId, userId },
        });

        if (!member) {
            throw new NotFoundException('Workspace não encontrado ou sem acesso');
        }

        // Converter initialBalance string -> centavos (int)
        const data: {
            name: string;
            workspaceId: string;
            initialBalanceCents?: number | null;
            agency?: string;
            account?: string;
        } = { name: dto.name, workspaceId };

        if (dto.initialBalance !== undefined) {
            data.initialBalanceCents = dto.initialBalance === '' ? null : this.toCents(dto.initialBalance);
        }
        if (dto.agency !== undefined) data.agency = dto.agency;
        if (dto.account !== undefined) data.account = dto.account;

        const account = await this.prisma.bankAccount.create({
            data,
        });

        return account;
    }

    async list(workspaceId: string, userId: string) {
        await this.ensureMember(workspaceId, userId);
        return this.prisma.bankAccount.findMany({
            where: { workspaceId },
            orderBy: { createdAt: 'desc' },
        });
    }

    async getOne(workspaceId: string, accountId: string, userId: string) {
        await this.ensureMember(workspaceId, userId);
        const account = await this.prisma.bankAccount.findFirst({
            where: { id: accountId, workspaceId },
        });
        if (!account) throw new NotFoundException('Conta não encontrada');
        return account;
    }

    async update(
        workspaceId: string,
        accountId: string,
        userId: string,
        dto: UpdateAccountDto,
    ) {
        await this.ensureMember(workspaceId, userId);

        // garante escopo ao workspace
        const exists = await this.prisma.bankAccount.findFirst({
            where: { id: accountId, workspaceId },
            select: { id: true },
        });
        if (!exists) throw new NotFoundException('Conta não encontrada');

        const data: {
            name?: string;
            initialBalanceCents?: number | null;
            agency?: string | null;
            account?: string | null;
        } = {};

        if (dto.name !== undefined) data.name = dto.name;
        if (dto.agency !== undefined) data.agency = dto.agency ?? null;
        if (dto.account !== undefined) data.account = dto.account ?? null;
        if (dto.initialBalance !== undefined)
            data.initialBalanceCents = dto.initialBalance === '' ? null : this.toCents(dto.initialBalance);

        return this.prisma.bankAccount.update({ where: { id: accountId }, data });
    }

    async remove(workspaceId: string, accountId: string, userId: string) {
        await this.ensureMember(workspaceId, userId);

        // garante escopo
        const exists = await this.prisma.bankAccount.findFirst({
            where: { id: accountId, workspaceId },
            select: { id: true },
        });
        if (!exists) throw new NotFoundException('Conta não encontrada');

        await this.prisma.bankAccount.delete({ where: { id: accountId } });
        return { message: 'Conta removida com sucesso' };
    }

    // Helpers
    private async ensureMember(workspaceId: string, userId: string) {
        const member = await this.prisma.workspaceMember.findFirst({
            where: { workspaceId, userId },
            select: { id: true },
        });
        if (!member) throw new NotFoundException('Workspace não encontrado ou sem acesso');
    }

    private toCents(value: string): number {
        const trimmed = value.trim();
        const dot = trimmed.lastIndexOf('.');
        const comma = trimmed.lastIndexOf(',');
        let normalized = trimmed;
        if (dot === -1 && comma === -1) {
            // apenas dígitos
            normalized = trimmed;
        } else if (comma > dot) {
            // vírgula é decimal: remove pontos (milhar) e troca vírgula por ponto
            normalized = trimmed.replace(/\./g, '').replace(/,/g, '.');
        } else {
            // ponto é decimal: remove vírgulas (milhar) mantém ponto
            normalized = trimmed.replace(/,/g, '');
        }
        const num = Number(normalized);
        if (Number.isNaN(num)) throw new NotFoundException('Valor monetário inválido');
        return Math.round(num * 100);
    }
}
