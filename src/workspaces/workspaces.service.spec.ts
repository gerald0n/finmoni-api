import { Test, TestingModule } from '@nestjs/testing';
import { WorkspacesService } from './workspaces.service';
import { PrismaService } from '../prisma/prisma.service';
import { WorkspaceRole } from '@prisma/client';
import { ConflictException, NotFoundException } from '@nestjs/common';

describe('WorkspacesService', () => {
  let service: WorkspacesService;
  let prisma: PrismaService;

  const mockPrismaService = {
    workspace: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    workspaceMember: {
      create: jest.fn(),
      findFirst: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    workspaceInvite: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WorkspacesService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<WorkspacesService>(WorkspacesService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a workspace successfully', async () => {
      const userId = 'user-id';
      const createWorkspaceDto = {
        name: 'Test Workspace',
        description: 'Test Description',
      };

      const mockWorkspace = {
        id: 'workspace-id',
        name: 'Test Workspace',
        description: 'Test Description',
        creatorId: userId,
        createdAt: new Date(),
        updatedAt: new Date(),
        members: [
          {
            id: 'member-id',
            role: WorkspaceRole.OWNER,
            userId,
            user: {
              id: userId,
              name: 'Test User',
              email: 'test@example.com',
            },
          },
        ],
        creator: {
          id: userId,
          name: 'Test User',
          email: 'test@example.com',
        },
        _count: {
          members: 1,
        },
      };

      mockPrismaService.workspace.create.mockResolvedValue(mockWorkspace);

      const result = await service.create(userId, createWorkspaceDto);

      expect(result).toEqual(mockWorkspace);
      expect(mockPrismaService.workspace.create).toHaveBeenCalledWith({
        data: {
          name: createWorkspaceDto.name,
          description: createWorkspaceDto.description,
          creatorId: userId,
          members: {
            create: {
              userId: userId,
              role: WorkspaceRole.OWNER,
            },
          },
        },
        include: expect.any(Object),
      });
    });
  });

  describe('findAllByUser', () => {
    it('should return user workspaces with current user role', async () => {
      const userId = 'user-id';
      const mockWorkspaces = [
        {
          id: 'workspace-1',
          name: 'Workspace 1',
          members: [
            {
              userId,
              role: WorkspaceRole.OWNER,
              user: {
                id: userId,
                name: 'Test User',
                email: 'test@example.com',
              },
            },
          ],
          creator: { id: userId, name: 'Test User', email: 'test@example.com' },
          _count: { members: 1 },
        },
      ];

      mockPrismaService.workspace.findMany.mockResolvedValue(mockWorkspaces);

      const result = await service.findAllByUser(userId);

      expect(result).toEqual([
        {
          ...mockWorkspaces[0],
          currentUserRole: WorkspaceRole.OWNER,
        },
      ]);
    });
  });

  describe('inviteMember', () => {
    it('should throw ConflictException if user is already a member', async () => {
      const workspaceId = 'workspace-id';
      const userId = 'user-id';
      const inviteDto = {
        email: 'existing@example.com',
        role: WorkspaceRole.MEMBER,
      };

      // Mock user permission check
      mockPrismaService.workspaceMember.findFirst
        .mockResolvedValueOnce({
          // First call for permission check
          role: WorkspaceRole.OWNER,
        })
        .mockResolvedValueOnce({
          // Second call for existing member check
          id: 'existing-member-id',
        });

      await expect(
        service.inviteMember(workspaceId, userId, inviteDto),
      ).rejects.toThrow(ConflictException);
    });

    it('should create invite successfully', async () => {
      const workspaceId = 'workspace-id';
      const userId = 'user-id';
      const inviteDto = {
        email: 'new@example.com',
        role: WorkspaceRole.MEMBER,
      };

      const mockInvite = {
        id: 'invite-id',
        email: inviteDto.email,
        role: inviteDto.role,
        token: 'mock-token',
        sender: { id: userId, name: 'Test User', email: 'test@example.com' },
        workspace: { id: workspaceId, name: 'Test Workspace' },
      };

      // Mock permission check (user is owner/admin)
      mockPrismaService.workspaceMember.findFirst
        .mockResolvedValueOnce({ role: WorkspaceRole.OWNER })
        .mockResolvedValueOnce(null); // No existing member

      // Mock no existing invite
      mockPrismaService.workspaceInvite.findFirst.mockResolvedValue(null);

      mockPrismaService.workspaceInvite.create.mockResolvedValue(mockInvite);

      const result = await service.inviteMember(workspaceId, userId, inviteDto);

      expect(result).toEqual(mockInvite);
      expect(mockPrismaService.workspaceInvite.create).toHaveBeenCalled();
    });
  });
});
