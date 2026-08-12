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
    const { equipmentId, quantity, purposeType, purposeNote } = body;

    if (!equipmentId) {
      return NextResponse.json({ error: 'ไม่พบรหัสอุปกรณ์' }, { status: 400 });
    }

    const qty = parseInt(quantity, 10);
    if (isNaN(qty) || qty <= 0) {
      return NextResponse.json({ error: 'จำนวนที่เบิกต้องเป็นตัวเลขมากกว่า 0' }, { status: 400 });
    }

    if (!['CURRENT_EVENT', 'GENERAL'].includes(purposeType)) {
      return NextResponse.json({ error: 'วัตถุประสงค์การเบิกไม่ถูกต้อง' }, { status: 400 });
    }

    let activeEventId: string | null = null;

    if (purposeType === 'CURRENT_EVENT') {
      const activeEvent = await prisma.event.findFirst({
        where: { status: 'ACTIVE' },
      });
      if (!activeEvent) {
        return NextResponse.json(
          { error: 'ไม่พบงานปัจจุบันที่กำลังดำเนินอยู่เพื่อทำการเบิก' },
          { status: 400 }
        );
      }
      activeEventId = activeEvent.id;
    } else {
      if (!purposeNote || !purposeNote.trim()) {
        return NextResponse.json(
          { error: 'กรุณาระบุรายละเอียดการนำอุปกรณ์ไปใช้งานทั่วไป' },
          { status: 400 }
        );
      }
    }

    // Execute database transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Fetch equipment to verify existance
      const equipment = await tx.equipment.findUnique({
        where: { id: equipmentId },
      });

      if (!equipment || equipment.deletedAt) {
        throw new Error('ไม่พบข้อมูลอุปกรณ์ในคลัง');
      }

      // 2. Perform atomic conditional update on quantities
      const affectedRows = await tx.$executeRaw`
        UPDATE equipment
        SET availableQuantity = availableQuantity - ${qty},
            inUseQuantity = inUseQuantity + ${qty},
            updatedAt = CURRENT_TIMESTAMP
        WHERE id = ${equipmentId}
          AND availableQuantity >= ${qty}
      `;

      if (affectedRows === 0) {
        throw new Error(`ไม่สามารถเบิกเกินจำนวนที่พร้อมใช้งานได้ (สูงสุด ${equipment.availableQuantity} ชิ้น)`);
      }

      // 3. Create the borrow record
      const borrow = await tx.borrowRecord.create({
        data: {
          equipmentId,
          eventId: activeEventId,
          borrowedBy: session.user.id,
          quantity: qty,
          purposeType,
          purposeNote: purposeType === 'GENERAL' ? purposeNote.trim() : null,
          status: 'OUTSTANDING',
        },
      });

      return borrow;
    });

    return NextResponse.json({ success: true, borrow: result }, { status: 201 });
  } catch (error: any) {
    console.error('Borrow API error:', error);
    return NextResponse.json(
      { error: error.message || 'เกิดข้อผิดพลาดของระบบ' },
      { status: 400 }
    );
  }
}
