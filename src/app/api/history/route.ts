import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const equipmentId = searchParams.get('equipmentId');
    const filterType = searchParams.get('type'); // 'BORROW', 'RETURN', 'ADJUST'

    const whereEquipment = equipmentId ? { equipmentId } : {};
    const whereBorrowEquipment = equipmentId ? { borrowRecord: { equipmentId } } : {};

    // 1. Fetch Borrows
    let borrows: any[] = [];
    if (!filterType || filterType === 'BORROW') {
      borrows = await prisma.borrowRecord.findMany({
        where: whereEquipment,
        include: {
          equipment: { select: { name: true, imageUrl: true } },
          borrower: { select: { displayName: true } },
          event: { select: { name: true } },
        },
        orderBy: { createdAt: 'desc' },
      });
    }

    // 2. Fetch Returns
    let returns: any[] = [];
    if (!filterType || filterType === 'RETURN') {
      returns = await prisma.returnRecord.findMany({
        where: whereBorrowEquipment,
        include: {
          borrowRecord: {
            include: {
              equipment: { select: { name: true, imageUrl: true } },
            },
          },
          returner: { select: { displayName: true } },
        },
        orderBy: { createdAt: 'desc' },
      });
    }

    // 3. Fetch Adjustments
    let adjustments: any[] = [];
    if (!filterType || filterType === 'ADJUST') {
      adjustments = await prisma.inventoryAdjustment.findMany({
        where: whereEquipment,
        include: {
          equipment: { select: { name: true, imageUrl: true } },
          performer: { select: { displayName: true } },
        },
        orderBy: { createdAt: 'desc' },
      });
    }

    // Map to unified chronological transaction schema
    const formattedBorrows = borrows.map((b) => ({
      id: `borrow_${b.id}`,
      type: 'BORROW',
      timestamp: b.createdAt,
      equipmentName: b.equipment.name,
      equipmentImageUrl: b.equipment.imageUrl,
      userName: b.borrower.displayName,
      quantity: b.quantity,
      details: b.purposeType === 'CURRENT_EVENT' 
        ? `เบิกงานปัจุบัน: ${b.event?.name || 'ชื่องาน'}` 
        : `เบิกทั่วไป: ${b.purposeNote || ''}`,
    }));

    const formattedReturns = returns.map((r) => {
      const equip = r.borrowRecord.equipment;
      let detailStr = `คืนจำนวน ${r.returnedQuantity} ชิ้น`;
      if (r.unavailableQuantity > 0) {
        const reasonText = r.unavailableReason === 'DAMAGED' ? 'ชำรุด' : 'อื่นๆ';
        detailStr += ` (ขาดส่ง ${r.unavailableQuantity} ชิ้น เนื่องจาก${reasonText}${r.note ? ': ' + r.note : ''})`;
      }
      return {
        id: `return_${r.id}`,
        type: 'RETURN',
        timestamp: r.createdAt,
        equipmentName: equip.name,
        equipmentImageUrl: equip.imageUrl,
        userName: r.returner.displayName,
        quantity: r.returnedQuantity,
        unavailableQuantity: r.unavailableQuantity,
        details: detailStr,
      };
    });

    const formattedAdjustments = adjustments.map((a) => {
      let typeText = 'ปรับยอดสินค้า';
      let detailText = '';
      if (a.adjustmentType === 'ADD_STOCK') {
        typeText = 'เพิ่มสต็อกสินค้า';
        detailText = `เพิ่มจำนวน ${a.quantity} ชิ้น (${a.reason || ''})`;
      } else if (a.adjustmentType === 'REMOVE_STOCK') {
        typeText = 'ลดสต็อกสินค้า';
        detailText = `ลดจำนวน ${a.quantity} ชิ้น (เหตุผล: ${a.reason || ''})`;
      } else if (a.adjustmentType === 'REPAIR_RETURN') {
        typeText = 'ซ่อมเสร็จส่งคืน';
        detailText = `ซ่อมเสร็จคืนคลังจำนวน ${a.quantity} ชิ้น`;
      }

      return {
        id: `adjust_${a.id}`,
        type: a.adjustmentType,
        typeLabel: typeText,
        timestamp: a.createdAt,
        equipmentName: a.equipment.name,
        equipmentImageUrl: a.equipment.imageUrl,
        userName: a.performer.displayName,
        quantity: a.quantity,
        details: detailText,
      };
    });

    // Combine and sort by timestamp descending
    const combinedHistory = [
      ...formattedBorrows,
      ...formattedReturns,
      ...formattedAdjustments,
    ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return NextResponse.json(combinedHistory);
  } catch (error) {
    console.error('Fetch history API error:', error);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดของระบบ' }, { status: 500 });
  }
}
