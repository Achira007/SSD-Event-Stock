import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { borrowRecordId, returnedQuantity, isFinal, unavailableReason, note } = body;

    if (!borrowRecordId) {
      return NextResponse.json({ error: 'ไม่พบรหัสการเบิกอุปกรณ์' }, { status: 400 });
    }

    const retQty = parseInt(returnedQuantity, 10);
    if (isNaN(retQty) || retQty < 0) {
      return NextResponse.json({ error: 'จำนวนที่คืนต้องเป็นตัวเลขที่ไม่ติดลบ' }, { status: 400 });
    }

    // Run database transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Fetch the borrow record with existing returns
      const borrowRecord = await tx.borrowRecord.findUnique({
        where: { id: borrowRecordId },
        include: {
          returns: true,
        },
      });

      if (!borrowRecord) {
        throw new Error('ไม่พบรายการเบิกอุปกรณ์ดังกล่าว');
      }

      if (borrowRecord.status === 'COMPLETED') {
        throw new Error('รายการเบิกนี้ได้ทำรายการคืนครบเสร็จสิ้นแล้ว');
      }

      // 2. Calculate outstanding quantity
      const totalResolved = borrowRecord.returns.reduce(
        (sum, ret) => sum + ret.returnedQuantity + ret.unavailableQuantity,
        0
      );
      const outstanding = borrowRecord.quantity - totalResolved;

      if (retQty > outstanding) {
        throw new Error(`ไม่สามารถคืนเกินจำนวนค้างส่งได้ (สูงสุด ${outstanding} ชิ้น)`);
      }

      // 3. Determine missing (unavailable) quantity
      let unavailableQty = 0;
      let finalReason: string | null = null;
      let finalNote: string | null = null;

      if (retQty < outstanding && isFinal) {
        unavailableQty = outstanding - retQty;
        
        if (!['DAMAGED', 'OTHER'].includes(unavailableReason)) {
          throw new Error('กรุณาระบุเหตุผลสำหรับอุปกรณ์ที่ขาดส่ง (ชำรุด หรือ อื่นๆ)');
        }
        
        finalReason = unavailableReason;
        if (unavailableReason === 'OTHER') {
          if (!note || !note.trim()) {
            throw new Error('กรุณาระบุหมายเหตุสาเหตุการขาดส่งอุปกรณ์');
          }
          finalNote = note.trim();
        }
      }

      const resolvedQty = retQty + unavailableQty;
      if (resolvedQty <= 0) {
        throw new Error('จำนวนการคืนและขาดส่งต้องมากกว่า 0');
      }

      // 4. Update equipment table atomically
      const affectedRows = await tx.$executeRaw`
        UPDATE equipment
        SET availableQuantity = availableQuantity + ${retQty},
            unavailableQuantity = unavailableQuantity + ${unavailableQty},
            inUseQuantity = inUseQuantity - ${resolvedQty},
            updatedAt = CURRENT_TIMESTAMP
        WHERE id = ${borrowRecord.equipmentId}
          AND inUseQuantity >= ${resolvedQty}
      `;

      if (affectedRows === 0) {
        throw new Error('เกิดข้อผิดพลาดในการปรับสถานะจำนวนอุปกรณ์ในคลัง');
      }

      // 5. Create return record
      const returnRecord = await tx.returnRecord.create({
        data: {
          borrowRecordId,
          returnedBy: session.user.id,
          returnedQuantity: retQty,
          unavailableQuantity: unavailableQty,
          unavailableReason: finalReason,
          note: finalNote,
        },
      });

      // 6. Check if borrow is now fully resolved and update status
      if (totalResolved + resolvedQty === borrowRecord.quantity) {
        await tx.borrowRecord.update({
          where: { id: borrowRecordId },
          data: {
            status: 'COMPLETED',
            completedAt: new Date(),
          },
        });
      }

      return returnRecord;
    });

    return NextResponse.json({ success: true, returnRecord: result }, { status: 201 });
  } catch (error: any) {
    console.error('Return API error:', error);
    return NextResponse.json(
      { error: error.message || 'เกิดข้อผิดพลาดของระบบ' },
      { status: 400 }
    );
  }
}
