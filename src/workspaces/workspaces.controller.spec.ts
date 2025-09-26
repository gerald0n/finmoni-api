import { Test, TestingModule } from '@nestjs/testing';
import { WorkspacesController } from './workspaces.controller';
import { WorkspacesService } from './workspaces.service';
import { WorkspaceRole } from '@prisma/client';

describe('WorkspacesController', () => {
  let controller: WorkspacesController;
  let service: WorkspacesService;

  const mockWorkspacesService = {
    create: jest.fn(),
    findAllByUser: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    inviteMember: jest.fn(),
    getUserInvites: jest.fn(),
    acceptInvite: jest.fn(),
    declineInvite: jest.fn(),
    updateMemberRole: jest.fn(),
    removeMember: jest.fn(),
    leaveWorkspace: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WorkspacesController],
      providers: [
        {
          provide: WorkspacesService,
          useValue: mockWorkspacesService,
        },
      ],
    }).compile();

    controller = module.get<WorkspacesController>(WorkspacesController);
    service = module.get<WorkspacesService>(WorkspacesService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a workspace', async () => {
      const req = { user: { id: 'user-id' } };
      const createDto = { name: 'Test Workspace' };
      const mockResult = { id: 'workspace-id', name: 'Test Workspace' };

      mockWorkspacesService.create.mockResolvedValue(mockResult);

      const result = await controller.create(req, createDto);

      expect(result).toEqual(mockResult);
      expect(service.create).toHaveBeenCalledWith(req.user.id, createDto);
    });
  });

  describe('findAll', () => {
    it('should return user workspaces', async () => {
      const req = { user: { id: 'user-id' } };
      const mockWorkspaces = [
        {
          id: 'workspace-1',
          name: 'Workspace 1',
          currentUserRole: WorkspaceRole.OWNER,
        },
      ];

      mockWorkspacesService.findAllByUser.mockResolvedValue(mockWorkspaces);

      const result = await controller.findAll(req);

      expect(result).toEqual(mockWorkspaces);
      expect(service.findAllByUser).toHaveBeenCalledWith(req.user.id);
    });
  });

  describe('inviteMember', () => {
    it('should invite a member', async () => {
      const req = { user: { id: 'user-id' } };
      const workspaceId = 'workspace-id';
      const inviteDto = {
        email: 'test@example.com',
        role: WorkspaceRole.MEMBER,
      };
      const mockInvite = { id: 'invite-id', email: 'test@example.com' };

      mockWorkspacesService.inviteMember.mockResolvedValue(mockInvite);

      const result = await controller.inviteMember(workspaceId, req, inviteDto);

      expect(result).toEqual(mockInvite);
      expect(service.inviteMember).toHaveBeenCalledWith(
        workspaceId,
        req.user.id,
        inviteDto,
      );
    });
  });
});
