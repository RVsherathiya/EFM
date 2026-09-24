import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import mongoose, { Types } from 'mongoose';
import { User } from '../src/models/User.model.js';
import { UserHierarchy } from '../src/models/UserHierarchy.model.js';
import { ManagerHistory } from '../src/models/ManagerHistory.model.js';
import { hierarchyService } from '../src/domain/hierarchy/hierarchy.service.js';
import { setupTestDatabase, teardownTestDatabase, clearTestDatabase } from './db-helper.js';

describe('Organisation Hierarchy Domain Engine', () => {
  beforeAll(async () => {
    await setupTestDatabase();
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  beforeEach(async () => {
    await clearTestDatabase();
  });

  it('BR-ORG-002: should strictly prevent an employee from reporting to themselves', async () => {
    const empId = new Types.ObjectId();
    await expect(hierarchyService.validateManagerAssignment(empId, empId)).rejects.toThrow(
      /Self-reporting is strictly prohibited/
    );
  });

  it('BR-ORG-002: should prevent hierarchy cycle (e.g. Manager cannot report to direct/indirect subordinate)', async () => {
    // Setup 3 levels: CEO (A) -> Senior Manager (B) -> Employee (C)
    const userA = await User.create({
      employeeCode: 'EMP-A',
      email: 'a@company.com',
      passwordHash: 'hash',
      firstName: 'Alice',
      lastName: 'CEO',
      designation: 'CEO',
      level: 'L7',
      roles: ['SUPER_ADMIN'],
    });

    const userB = await User.create({
      employeeCode: 'EMP-B',
      email: 'b@company.com',
      passwordHash: 'hash',
      firstName: 'Bob',
      lastName: 'Senior',
      designation: 'Engineering Manager',
      level: 'L5',
      managerId: userA._id,
      roles: ['SENIOR'],
    });

    const userC = await User.create({
      employeeCode: 'EMP-C',
      email: 'c@company.com',
      passwordHash: 'hash',
      firstName: 'Charlie',
      lastName: 'Dev',
      designation: 'Software Engineer',
      level: 'L2',
      managerId: userB._id,
      roles: ['EMPLOYEE'],
    });

    // Materialize hierarchy
    await hierarchyService.rebuildHierarchyTree();

    // Verify Bob is ancestor of Charlie
    const descendantsOfB = await hierarchyService.getDescendantUserIds(userB._id);
    expect(descendantsOfB.map((id) => id.toString())).toContain(userC._id.toString());

    // Attempting to make Alice report to Charlie must throw cycle error
    await expect(hierarchyService.validateManagerAssignment(userA._id, userC._id)).rejects.toThrow(
      /Hierarchy cycle detected/
    );
  });

  it('BR-ORG-003: updating manager should record effective-dated ManagerHistory', async () => {
    const admin = await User.create({
      employeeCode: 'ADMIN-01',
      email: 'admin@company.com',
      passwordHash: 'hash',
      firstName: 'Admin',
      lastName: 'User',
      designation: 'HR',
      level: 'L6',
      roles: ['HR_ADMIN'],
    });

    const manager1 = await User.create({
      employeeCode: 'MGR-01',
      email: 'mgr1@company.com',
      passwordHash: 'hash',
      firstName: 'Manager',
      lastName: 'One',
      designation: 'Lead',
      level: 'L5',
      roles: ['SENIOR'],
    });

    const manager2 = await User.create({
      employeeCode: 'MGR-02',
      email: 'mgr2@company.com',
      passwordHash: 'hash',
      firstName: 'Manager',
      lastName: 'Two',
      designation: 'Director',
      level: 'L6',
      roles: ['SENIOR'],
    });

    const employee = await User.create({
      employeeCode: 'DEV-01',
      email: 'dev1@company.com',
      passwordHash: 'hash',
      firstName: 'Dave',
      lastName: 'Developer',
      designation: 'Developer',
      level: 'L3',
      managerId: manager1._id,
      roles: ['EMPLOYEE'],
    });

    await hierarchyService.rebuildHierarchyTree();

    // Reassign employee to manager2
    await hierarchyService.updateManager(employee._id, manager2._id, admin._id, 'Team restructuring');

    const history = await ManagerHistory.find({ userId: employee._id });
    expect(history.length).toBe(1);
    expect(history[0].managerId?.toString()).toBe(manager2._id.toString());
    expect(history[0].reason).toBe('Team restructuring');

    const updatedEmployee = await User.findById(employee._id);
    expect(updatedEmployee?.managerId?.toString()).toBe(manager2._id.toString());
  });
});
