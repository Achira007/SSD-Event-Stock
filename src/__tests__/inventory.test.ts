import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '@/lib/db';

describe('Inventory Database Invariants & Concurrency', () => {
  let testUserId: string;
  let equipmentId: string;

  beforeAll(async () => {
    // 1. Create a test user
    const user = await prisma.user.upsert({
      where: { email: 'test-inventory-runner@example.com' },
      update: {},
      create: {
        googleSubjectId: 'test-inventory-runner-google-id',
        email: 'test-inventory-runner@example.com',
        displayName: 'Test Inventory Runner',
      },
    });
    testUserId = user.id;

    // 2. Create a test equipment with available_quantity = 1
    const equipment = await prisma.equipment.create({
      data: {
        name: 'Test Concurrency Device',
        imageUrl: '/uploads/placeholder.jpg',
        totalQuantity: 1,
        availableQuantity: 1,
        inUseQuantity: 0,
        unavailableQuantity: 0,
      },
    });
    equipmentId = equipment.id;
  });

  afterAll(async () => {
    // Clean up created records to avoid polluting the database
    await prisma.borrowRecord.deleteMany({
      where: { equipmentId },
    });
    await prisma.inventoryAdjustment.deleteMany({
      where: { equipmentId },
    });
    await prisma.equipment.deleteMany({
      where: { id: equipmentId },
    });
    await prisma.user.deleteMany({
      where: { id: testUserId },
    });
  });

  it('should satisfy the inventory equation invariant: total = available + inUse + unavailable', async () => {
    const equip = await prisma.equipment.findUnique({
      where: { id: equipmentId },
    });

    expect(equip).toBeDefined();
    if (equip) {
      expect(equip.totalQuantity).toBe(
        equip.availableQuantity + equip.inUseQuantity + equip.unavailableQuantity
      );
    }
  });

  it('should handle concurrent borrow requests atomically and reject over-borrowing', async () => {
    // We attempt to perform two borrow transactions in parallel.
    // Each transaction wants to borrow 1 unit.
    // Since availableQuantity is 1, only one transaction must succeed.
    // The other must throw the custom error about insufficient quantity.

    const borrowQuantity = 1;

    // Wrap the transaction logic similar to the api/borrow/route.ts
    const runBorrowTx = async () => {
      return await prisma.$transaction(async (tx) => {
        const equipment = await tx.equipment.findUnique({
          where: { id: equipmentId },
        });

        if (!equipment || equipment.deletedAt) {
          throw new Error('ไม่พบข้อมูลอุปกรณ์ในคลัง');
        }

        // Perform conditional atomic update
        const affectedRows = await tx.$executeRaw`
          UPDATE equipment
          SET availableQuantity = availableQuantity - ${borrowQuantity},
              inUseQuantity = inUseQuantity + ${borrowQuantity},
              updatedAt = CURRENT_TIMESTAMP
          WHERE id = ${equipmentId}
            AND availableQuantity >= ${borrowQuantity}
        `;

        if (affectedRows === 0) {
          throw new Error(`ไม่สามารถเบิกเกินจำนวนที่พร้อมใช้งานได้ (สูงสุด ${equipment.availableQuantity} ชิ้น)`);
        }

        // Create the borrow record
        const borrow = await tx.borrowRecord.create({
          data: {
            equipmentId,
            eventId: null,
            borrowedBy: testUserId,
            quantity: borrowQuantity,
            purposeType: 'GENERAL',
            purposeNote: 'Concurrent Test Borrow',
            status: 'OUTSTANDING',
          },
        });

        return borrow;
      });
    };

    // Execute concurrently
    const results = await Promise.allSettled([runBorrowTx(), runBorrowTx()]);

    const fulfilled = results.filter((r) => r.status === 'fulfilled');
    const rejected = results.filter((r) => r.status === 'rejected');



    // Exactly one must succeed, one must fail
    expect(fulfilled.length).toBe(1);
    expect(rejected.length).toBe(1);

    // Verify error message of the rejected promise
    const errorReason = (rejected[0] as PromiseRejectedResult).reason as Error;
    expect(errorReason.message).toContain('ไม่สามารถเบิกเกินจำนวนที่พร้อมใช้งานได้');

    // Verify the database quantities after concurrent updates
    const finalEquip = await prisma.equipment.findUnique({
      where: { id: equipmentId },
    });

    expect(finalEquip).toBeDefined();
    if (finalEquip) {
      expect(finalEquip.availableQuantity).toBe(0);
      expect(finalEquip.inUseQuantity).toBe(1);
      expect(finalEquip.totalQuantity).toBe(1);
      // Invariant still holds
      expect(finalEquip.totalQuantity).toBe(
        finalEquip.availableQuantity + finalEquip.inUseQuantity + finalEquip.unavailableQuantity
      );
    }
  });
});
