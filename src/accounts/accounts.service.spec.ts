import { Test, TestingModule } from '@nestjs/testing';
import { AccountsService } from './accounts.service';
import { PrismaService } from '../prisma/prisma.service';

describe('AccountsService', () => {
    let service: AccountsService;
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
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    it('creates account when user is member converting to cents', async () => {
        mockPrisma.workspaceMember.findFirst.mockResolvedValue({ id: 'member' });
        const mockAccount = { id: 'acc', name: 'Banco X', workspaceId: 'w1', initialBalanceCents: 100050 };
        mockPrisma.bankAccount.create.mockResolvedValue(mockAccount);

        const result = await service.create('w1', 'u1', { name: 'Banco X', initialBalance: '1000.50' });
        expect(result).toEqual(mockAccount);
        expect(mockPrisma.bankAccount.create).toHaveBeenCalledWith({
            data: { name: 'Banco X', workspaceId: 'w1', initialBalanceCents: 100050 },
        });
    });
});
