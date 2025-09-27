import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { AccountsService } from './accounts.service';
import { PrismaService } from '../prisma/prisma.service';

describe('AccountsService', () => {
    let service: AccountsService;
    let prismaService: jest.Mocked<PrismaService>;

    const mockPrisma = {
        workspaceMember: {
            findFirst: jest.fn(),
        },
        bankAccount: {
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
                AccountsService,
                { provide: PrismaService, useValue: mockPrisma },
            ],
        }).compile();

        service = module.get<AccountsService>(AccountsService);
        prismaService = module.get(PrismaService);

        // Reset all mocks before each test
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('create', () => {
        const workspaceId = 'workspace-1';
        const userId = 'user-1';
        const createAccountDto = {
            name: 'Banco do Brasil',
            initialBalance: '1000.50',
            agency: '1234-5',
            account: '67890-1',
        };

        it('should create account successfully when user is member', async () => {
            const mockMember = { id: 'member-1', userId, workspaceId };
            const mockAccount = {
                id: 'account-1',
                name: 'Banco do Brasil',
                initialBalanceCents: 100050,
                agency: '1234-5',
                account: '67890-1',
                workspaceId,
                ownerId: userId,
                owner: { id: userId, name: 'User Name', email: 'user@test.com' },
            };

            mockPrisma.workspaceMember.findFirst.mockResolvedValue(mockMember);
            mockPrisma.bankAccount.create.mockResolvedValue(mockAccount);

            const result = await service.create(workspaceId, createAccountDto, userId);

            expect(result).toEqual(mockAccount);
            expect(mockPrisma.workspaceMember.findFirst).toHaveBeenCalledWith({
                where: { userId, workspaceId },
            });
            expect(mockPrisma.bankAccount.create).toHaveBeenCalledWith({
                data: {
                    name: 'Banco do Brasil',
                    initialBalanceCents: 100050,
                    agency: '1234-5',
                    account: '67890-1',
                    workspaceId,
                    ownerId: userId,
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
        });

        it('should create account without optional fields', async () => {
            const minimalDto = { name: 'Banco Simples' };
            const mockMember = { id: 'member-1', userId, workspaceId };
            const mockAccount = {
                id: 'account-1',
                name: 'Banco Simples',
                workspaceId,
                ownerId: userId,
            };

            mockPrisma.workspaceMember.findFirst.mockResolvedValue(mockMember);
            mockPrisma.bankAccount.create.mockResolvedValue(mockAccount);

            const result = await service.create(workspaceId, minimalDto, userId);

            expect(result).toEqual(mockAccount);
            expect(mockPrisma.bankAccount.create).toHaveBeenCalledWith({
                data: {
                    name: 'Banco Simples',
                    initialBalanceCents: null,
                    agency: undefined,
                    account: undefined,
                    workspaceId,
                    ownerId: userId,
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
        });

        it('should throw ForbiddenException when user is not workspace member', async () => {
            mockPrisma.workspaceMember.findFirst.mockResolvedValue(null);

            await expect(
                service.create(workspaceId, createAccountDto, userId)
            ).rejects.toThrow(ForbiddenException);

            expect(mockPrisma.bankAccount.create).not.toHaveBeenCalled();
        });
    });

    describe('list', () => {
        const workspaceId = 'workspace-1';
        const userId = 'user-1';

        it('should return list of accounts when user is member', async () => {
            const mockMember = { id: 'member-1', userId, workspaceId };
            const mockAccounts = [
                {
                    id: 'account-1',
                    name: 'Banco A',
                    workspaceId,
                    owner: { id: userId, name: 'User Name', email: 'user@test.com' },
                },
                {
                    id: 'account-2',
                    name: 'Banco B',
                    workspaceId,
                    owner: { id: userId, name: 'User Name', email: 'user@test.com' },
                },
            ];

            mockPrisma.workspaceMember.findFirst.mockResolvedValue(mockMember);
            mockPrisma.bankAccount.findMany.mockResolvedValue(mockAccounts);

            const result = await service.list(workspaceId, userId);

            expect(result).toEqual(mockAccounts);
            expect(mockPrisma.bankAccount.findMany).toHaveBeenCalledWith({
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
        });

        it('should throw ForbiddenException when user is not workspace member', async () => {
            mockPrisma.workspaceMember.findFirst.mockResolvedValue(null);

            await expect(service.list(workspaceId, userId)).rejects.toThrow(ForbiddenException);
        });
    });

    describe('getOne', () => {
        const workspaceId = 'workspace-1';
        const accountId = 'account-1';
        const userId = 'user-1';

        it('should return account when found', async () => {
            const mockMember = { id: 'member-1', userId, workspaceId };
            const mockAccount = {
                id: accountId,
                name: 'Banco Test',
                workspaceId,
                owner: { id: userId, name: 'User Name', email: 'user@test.com' },
            };

            mockPrisma.workspaceMember.findFirst.mockResolvedValue(mockMember);
            mockPrisma.bankAccount.findFirst.mockResolvedValue(mockAccount);

            const result = await service.getOne(workspaceId, accountId, userId);

            expect(result).toEqual(mockAccount);
            expect(mockPrisma.bankAccount.findFirst).toHaveBeenCalledWith({
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
        });

        it('should throw NotFoundException when account not found', async () => {
            const mockMember = { id: 'member-1', userId, workspaceId };

            mockPrisma.workspaceMember.findFirst.mockResolvedValue(mockMember);
            mockPrisma.bankAccount.findFirst.mockResolvedValue(null);

            await expect(
                service.getOne(workspaceId, accountId, userId)
            ).rejects.toThrow(NotFoundException);
        });

        it('should throw ForbiddenException when user is not workspace member', async () => {
            mockPrisma.workspaceMember.findFirst.mockResolvedValue(null);

            await expect(
                service.getOne(workspaceId, accountId, userId)
            ).rejects.toThrow(ForbiddenException);
        });
    });

    describe('update', () => {
        const workspaceId = 'workspace-1';
        const accountId = 'account-1';
        const userId = 'user-1';
        const updateDto = {
            name: 'Banco Atualizado',
            initialBalance: '2000.75',
        };

        it('should update account successfully', async () => {
            const mockMember = { id: 'member-1', userId, workspaceId };
            const mockExistingAccount = { id: accountId, name: 'Banco Antigo', workspaceId };
            const mockUpdatedAccount = {
                id: accountId,
                name: 'Banco Atualizado',
                initialBalanceCents: 200075,
                workspaceId,
                owner: { id: userId, name: 'User Name', email: 'user@test.com' },
            };

            mockPrisma.workspaceMember.findFirst.mockResolvedValue(mockMember);
            mockPrisma.bankAccount.findFirst.mockResolvedValue(mockExistingAccount);
            mockPrisma.bankAccount.update.mockResolvedValue(mockUpdatedAccount);

            const result = await service.update(workspaceId, accountId, updateDto, userId);

            expect(result).toEqual(mockUpdatedAccount);
            expect(mockPrisma.bankAccount.update).toHaveBeenCalledWith({
                where: { id: accountId },
                data: {
                    name: 'Banco Atualizado',
                    initialBalanceCents: 200075,
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
        });

        it('should throw NotFoundException when account not found', async () => {
            const mockMember = { id: 'member-1', userId, workspaceId };

            mockPrisma.workspaceMember.findFirst.mockResolvedValue(mockMember);
            mockPrisma.bankAccount.findFirst.mockResolvedValue(null);

            await expect(
                service.update(workspaceId, accountId, updateDto, userId)
            ).rejects.toThrow(NotFoundException);
        });

        it('should throw ForbiddenException when user is not workspace member', async () => {
            mockPrisma.workspaceMember.findFirst.mockResolvedValue(null);

            await expect(
                service.update(workspaceId, accountId, updateDto, userId)
            ).rejects.toThrow(ForbiddenException);
        });
    });

    describe('remove', () => {
        const workspaceId = 'workspace-1';
        const accountId = 'account-1';
        const userId = 'user-1';

        it('should remove account successfully', async () => {
            const mockMember = { id: 'member-1', userId, workspaceId };
            const mockAccount = { id: accountId, name: 'Banco Test', workspaceId };

            mockPrisma.workspaceMember.findFirst.mockResolvedValue(mockMember);
            mockPrisma.bankAccount.findFirst.mockResolvedValue(mockAccount);
            mockPrisma.bankAccount.delete.mockResolvedValue(mockAccount);

            const result = await service.remove(workspaceId, accountId, userId);

            expect(result).toEqual({ message: 'Conta bancária removida com sucesso' });
            expect(mockPrisma.bankAccount.delete).toHaveBeenCalledWith({
                where: { id: accountId },
            });
        });

        it('should throw NotFoundException when account not found', async () => {
            const mockMember = { id: 'member-1', userId, workspaceId };

            mockPrisma.workspaceMember.findFirst.mockResolvedValue(mockMember);
            mockPrisma.bankAccount.findFirst.mockResolvedValue(null);

            await expect(
                service.remove(workspaceId, accountId, userId)
            ).rejects.toThrow(NotFoundException);

            expect(mockPrisma.bankAccount.delete).not.toHaveBeenCalled();
        });

        it('should throw ForbiddenException when user is not workspace member', async () => {
            mockPrisma.workspaceMember.findFirst.mockResolvedValue(null);

            await expect(
                service.remove(workspaceId, accountId, userId)
            ).rejects.toThrow(ForbiddenException);
        });
    });

    describe('toCents conversion', () => {
        it('should convert decimal values to cents correctly', async () => {
            const mockMember = { id: 'member-1' };
            const createDto = { name: 'Test', initialBalance: '1000.50' };

            mockPrisma.workspaceMember.findFirst.mockResolvedValue(mockMember);
            mockPrisma.bankAccount.create.mockResolvedValue({});

            await service.create('workspace-1', createDto, 'user-1');

            expect(mockPrisma.bankAccount.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({
                        initialBalanceCents: 100050,
                    }),
                })
            );
        });

        it('should handle comma as decimal separator', async () => {
            const mockMember = { id: 'member-1' };
            const createDto = { name: 'Test', initialBalance: '1000,75' };

            mockPrisma.workspaceMember.findFirst.mockResolvedValue(mockMember);
            mockPrisma.bankAccount.create.mockResolvedValue({});

            await service.create('workspace-1', createDto, 'user-1');

            expect(mockPrisma.bankAccount.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({
                        initialBalanceCents: 100075,
                    }),
                })
            );
        });

        it('should handle integer values', async () => {
            const mockMember = { id: 'member-1' };
            const createDto = { name: 'Test', initialBalance: '1000' };

            mockPrisma.workspaceMember.findFirst.mockResolvedValue(mockMember);
            mockPrisma.bankAccount.create.mockResolvedValue({});

            await service.create('workspace-1', createDto, 'user-1');

            expect(mockPrisma.bankAccount.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({
                        initialBalanceCents: 100000,
                    }),
                })
            );
        });
    });
});
