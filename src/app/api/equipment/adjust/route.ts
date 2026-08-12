import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const { equipmentId, adjustmentType, quantity, reason, source, note } = body;

    if (!equipmentId) {
      return NextResponse.json({ error: 'ไม่พบรหัสอุปกรณ์' }, { status: 400 });
    }

    if (!['ADD_STOCK', 'REMOVE_STOCK', 'REPAIR_RETURN'].includes(adjustmentType)) {
      return NextResponse.json({ error: 'ประเภทการปรับปรุงไม่ถูกต้อง' }, { status: 400 });
    }

    const qty = parseInt(quantity, 10);
    if (isNaN(qty) || qty <= 0) {
      return NextResponse.json({ error: 'จำนวนต้องมากกว่า 0' }, { status: 400 });
    }

    if (adjustmentType === 'REMOVE_STOCK' && (!reason || !reason.trim())) {
      return NextResponse.json({ error: 'กรุณาระบุสาเหตุในการปรับลดยอด' }, { status: 400 });
    }

    // Run transaction
    const result = await prisma.$transaction(async (tx) => {
      // Check if equipment exists
      const equipment = await tx.equipment.findUnique({
        where: { id: equipmentId },
      });

      if (!equipment) {
        throw new Error('ไม่พบอุปกรณ์ในระบบ');
      }

      let affectedRows = 0;

      if (adjustmentType === 'ADD_STOCK') {
        affectedRows = await tx.$executeRaw`
          UPDATE equipment
          SET totalQuantity = totalQuantity + ${qty},
              availableQuantity = availableQuantity + ${qty},
              updatedAt = CURRENT_TIMESTAMP
          WHERE id = ${equipmentId}
        `;
      } else if (adjustmentType === 'REMOVE_STOCK') {
        // Decide whether to remove from available or unavailable pool
        const removeSource = source === 'UNAVAILABLE' ? 'UNAVAILABLE' : 'AVAILABLE';

        if (removeSource === 'AVAILABLE') {
          affectedRows = await tx.$executeRaw`
            UPDATE equipment
            SET totalQuantity = totalQuantity - ${qty},
                availableQuantity = availableQuantity - ${qty},
                updatedAt = CURRENT_TIMESTAMP
            WHERE id = ${equipmentId}
              AND availableQuantity >= ${qty}
          `;
        } else {
          affectedRows = await tx.$executeRaw`
            UPDATE equipment
            SET totalQuantity = totalQuantity - ${qty},
                unavailableQuantity = unavailableQuantity - ${qty},
                updatedAt = CURRENT_TIMESTAMP
            WHERE id = ${equipmentId}
              AND unavailableQuantity >= ${qty}
          `;
        }

        if (affectedRows === 0) {
          throw new Error('จำนวนอุปกรณ์ในคลังไม่เพียงพอสำหรับการปรับยอดลดลง');
        }
      } else if (adjustmentType === 'REPAIR_RETURN') {
        affectedRows = await tx.$executeRaw`
          UPDATE equipment
          SET unavailableQuantity = unavailableQuantity - ${qty},
              availableQuantity = availableQuantity + ${qty},
              updatedAt = CURRENT_TIMESTAMP
          WHERE id = ${equipmentId}
            AND unavailableQuantity >= ${qty}
        `;

        if (affectedRows === 0) {
          throw new Error('จำนวนอุปกรณ์ชำรุดไม่เพียงพอสำหรับทำรายการนี้');
        }
      }

      // Record adjustment transaction
      const adjustment = await tx.inventoryAdjustment.create({
        data: {
          equipmentId,
          performedBy: session.user.id,
          adjustmentType,
          quantity: qty,
          reason: reason || (adjustmentType === 'ADD_STOCK' ? 'เพิ่มจำนวนคลัง' : ''),
          note: note || null,
        },
      });

      return adjustment;
    });

    return NextResponse.json({ success: true, adjustment: result });
  } catch (error: any) {
    console.error('Adjustment API error:', error);
    return NextResponse.json(
      { error: error.message || 'เกิดข้อผิดพลาดของระบบ' },
      { status: 400 }
    );
  }
}
