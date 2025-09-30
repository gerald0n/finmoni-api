import { Test, TestingModule } from '@nestjs/testing';
import { TransactionsController } from './transactions.controller';
import { TransactionsService } from './transactions.service';
import { CreateTransactionDto, TransactionType } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';

describe('TransactionsController', () => {
    let controller: TransactionsController;
    let service: TransactionsService;

    const mockTransactionsService = {
        create: jest.fn(),
        list: jest.fn(),
        getOne: jest.fn(),
        update: jest.fn(),
        remove: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [TransactionsController],
            providers: [
                {
                    provide: TransactionsService,
                    useValue: mockTransactionsService,
                },
            ],
        }).compile();

        controller = module.get<TransactionsController>(TransactionsController);
        service = module.get<TransactionsService>(TransactionsService);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    describe('create', () => {
        it('should create a transaction', async () => {
            const workspaceId = 'workspace-id';
            const createTransactionDto: CreateTransactionDto = {
                title: 'Freelance Payment',
                description: 'Payment for web development project',
                amount: '1500.50',
                date: '2024-09-29T10:30:00Z',
                type: TransactionType.INCOME,
                bankAccountId: 'bank-account-id',
            };
            const req = { user: { sub: 'user-id' } };

            const expectedResult = {
                id: 'transaction-id',
                ...createTransactionDto,
                amountCents: 150050,
                createdById: 'user-id',
            };

            mockTransactionsService.create.mockResolvedValue(expectedResult);

            const result = await controller.create(workspaceId, createTransactionDto, req);

            expect(result).toEqual(expectedResult);
            expect(service.create).toHaveBeenCalledWith(workspaceId, createTransactionDto, 'user-id');
        });
    });

    describe('list', () => {
        it('should list transactions', async () => {
            const workspaceId = 'workspace-id';
            const req = { user: { sub: 'user-id' } };
            const bankAccountId = 'bank-account-id';

            const expectedResult = [
                {
                    id: 'transaction-1',
                    title: 'Income Transaction',
                    type: TransactionType.INCOME,
                    amountCents: 100000,
                },
            ];

            mockTransactionsService.list.mockResolvedValue(expectedResult);

            const result = await controller.list(workspaceId, req, bankAccountId);

            expect(result).toEqual(expectedResult);
            expect(service.list).toHaveBeenCalledWith(workspaceId, 'user-id', bankAccountId);
        });
    });

    describe('getOne', () => {
        it('should get one transaction', async () => {
            const workspaceId = 'workspace-id';
            const transactionId = 'transaction-id';
            const req = { user: { sub: 'user-id' } };

            const expectedResult = {
                id: transactionId,
                title: 'Test Transaction',
                type: TransactionType.EXPENSE,
                amountCents: 50000,
            };

            mockTransactionsService.getOne.mockResolvedValue(expectedResult);

            const result = await controller.getOne(workspaceId, transactionId, req);

            expect(result).toEqual(expectedResult);
            expect(service.getOne).toHaveBeenCalledWith(workspaceId, transactionId, 'user-id');
        });
    });

    describe('update', () => {
        it('should update a transaction', async () => {
            const workspaceId = 'workspace-id';
            const transactionId = 'transaction-id';
            const updateTransactionDto: UpdateTransactionDto = {
                title: 'Updated Transaction',
                amount: '2000.00',
            };
            const req = { user: { sub: 'user-id' } };

            const expectedResult = {
                id: transactionId,
                ...updateTransactionDto,
                amountCents: 200000,
            };

            mockTransactionsService.update.mockResolvedValue(expectedResult);

            const result = await controller.update(workspaceId, transactionId, updateTransactionDto, req);

            expect(result).toEqual(expectedResult);
            expect(service.update).toHaveBeenCalledWith(workspaceId, transactionId, updateTransactionDto, 'user-id');
        });
    });

    describe('remove', () => {
        it('should remove a transaction', async () => {
            const workspaceId = 'workspace-id';
            const transactionId = 'transaction-id';
            const req = { user: { sub: 'user-id' } };

            const expectedResult = { message: 'Transação removida com sucesso' };

            mockTransactionsService.remove.mockResolvedValue(expectedResult);

            const result = await controller.remove(workspaceId, transactionId, req);

            expect(result).toEqual(expectedResult);
            expect(service.remove).toHaveBeenCalledWith(workspaceId, transactionId, 'user-id');
        });
    });
});