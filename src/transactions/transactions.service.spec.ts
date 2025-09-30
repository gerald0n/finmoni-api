import { Test, TestingModule } from '@nestjs/testing';
import { TransactionsService } from './transactions.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTransactionDto, TransactionType } from './dto/create-transaction.dto';
import { ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';

describe('TransactionsService', () => {
    let service: TransactionsService;
    let prismaService: PrismaService;

    const mockPrismaService = {
        workspaceMember: {
            findFirst: jest.fn(),
        },
        bankAccount: {
            findFirst: jest.fn(),
        },
        transaction: {
            create: jest.fn(),
            findMany: jest.fn(),
            findFirst: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
        },
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                TransactionsService,
                {
                    provide: PrismaService,
                    useValue: mockPrismaService,
                },
            ],
        }).compile();

        service = module.get<TransactionsService>(TransactionsService);
        prismaService = module.get<PrismaService>(PrismaService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('create', () => {
        const createTransactionDto: CreateTransactionDto = {
            title: 'Freelance Payment',
            description: 'Payment for web development project',
            amount: '1500.50',
            date: '2024-09-29T10:30:00Z',
            type: TransactionType.INCOME,
            bankAccountId: 'bank-account-id',
        };

        it('should create a transaction successfully', async () => {
            const workspaceId = 'workspace-id';
            const userId = 'user-id';

            mockPrismaService.workspaceMember.findFirst.mockResolvedValue({ id: 'member-id' });
            mockPrismaService.bankAccount.findFirst.mockResolvedValue({
                id: 'bank-account-id',
                workspaceId
            });
            mockPrismaService.transaction.create.mockResolvedValue({
                id: 'transaction-id',
                title: createTransactionDto.title,
                description: createTransactionDto.description,
                amountCents: 150050,
                date: new Date(createTransactionDto.date),
                type: createTransactionDto.type,
                bankAccount: { id: 'bank-account-id', name: 'My Bank Account' },
                createdBy: { id: userId, name: 'John Doe', email: 'john@example.com' },
            });

            const result = await service.create(workspaceId, createTransactionDto, userId);

            expect(result).toBeDefined();
            expect(result.amountCents).toBe(150050);
            expect(mockPrismaService.transaction.create).toHaveBeenCalledWith({
                data: {
                    title: createTransactionDto.title,
                    description: createTransactionDto.description,
                    amountCents: 150050,
                    date: new Date(createTransactionDto.date),
                    type: createTransactionDto.type,
                    bankAccountId: createTransactionDto.bankAccountId,
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
        });

        it('should throw ForbiddenException if user is not a workspace member', async () => {
            const workspaceId = 'workspace-id';
            const userId = 'user-id';

            mockPrismaService.workspaceMember.findFirst.mockResolvedValue(null);

            await expect(
                service.create(workspaceId, createTransactionDto, userId)
            ).rejects.toThrow(ForbiddenException);
        });

        it('should throw NotFoundException if bank account does not exist', async () => {
            const workspaceId = 'workspace-id';
            const userId = 'user-id';

            mockPrismaService.workspaceMember.findFirst.mockResolvedValue({ id: 'member-id' });
            mockPrismaService.bankAccount.findFirst.mockResolvedValue(null);

            await expect(
                service.create(workspaceId, createTransactionDto, userId)
            ).rejects.toThrow(NotFoundException);
        });

        it('should throw BadRequestException for invalid amount', async () => {
            const workspaceId = 'workspace-id';
            const userId = 'user-id';
            const invalidAmountDto = { ...createTransactionDto, amount: 'invalid-amount' };

            mockPrismaService.workspaceMember.findFirst.mockResolvedValue({ id: 'member-id' });
            mockPrismaService.bankAccount.findFirst.mockResolvedValue({
                id: 'bank-account-id',
                workspaceId
            });

            await expect(
                service.create(workspaceId, invalidAmountDto, userId)
            ).rejects.toThrow(BadRequestException);
        });
    });

    describe('list', () => {
        it('should list transactions for workspace', async () => {
            const workspaceId = 'workspace-id';
            const userId = 'user-id';

            mockPrismaService.workspaceMember.findFirst.mockResolvedValue({ id: 'member-id' });
            mockPrismaService.transaction.findMany.mockResolvedValue([
                {
                    id: 'transaction-1',
                    title: 'Income Transaction',
                    type: TransactionType.INCOME,
                    amountCents: 100000,
                    bankAccount: { id: 'bank-1', name: 'Bank Account 1' },
                    createdBy: { id: userId, name: 'John Doe', email: 'john@example.com' },
                },
            ]);

            const result = await service.list(workspaceId, userId);

            expect(result).toHaveLength(1);
            expect(result[0].title).toBe('Income Transaction');
        });

        it('should filter transactions by bank account', async () => {
            const workspaceId = 'workspace-id';
            const userId = 'user-id';
            const bankAccountId = 'bank-account-id';

            mockPrismaService.workspaceMember.findFirst.mockResolvedValue({ id: 'member-id' });
            mockPrismaService.bankAccount.findFirst.mockResolvedValue({
                id: bankAccountId,
                workspaceId
            });
            mockPrismaService.transaction.findMany.mockResolvedValue([]);

            await service.list(workspaceId, userId, bankAccountId);

            expect(mockPrismaService.transaction.findMany).toHaveBeenCalledWith({
                where: {
                    bankAccount: { workspaceId },
                    bankAccountId,
                },
                include: {
                    bankAccount: {
                        select: { id: true, name: true },
                    },
                    createdBy: {
                        select: { id: true, name: true, email: true },
                    },
                },
                orderBy: { date: 'desc' },
            });
        });
    });
});