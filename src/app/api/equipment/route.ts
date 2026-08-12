import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { storageService } from '@/lib/storage/storage';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const formData = await req.formData();
    const name = formData.get('name') as string;
    const initialQuantityStr = formData.get('initialQuantity') as string;
    const file = formData.get('image') as File | null;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'กรุณากรอกชื่ออุปกรณ์' }, { status: 400 });
    }

    const initialQuantity = parseInt(initialQuantityStr, 10);
    if (isNaN(initialQuantity) || initialQuantity < 0) {
      return NextResponse.json({ error: 'จำนวนเริ่มต้นต้องเป็นตัวเลขที่ไม่ติดลบ' }, { status: 400 });
    }

    if (!file || !(file instanceof File) || file.size === 0) {
      return NextResponse.json({ error: 'กรุณาอัปโหลดรูปภาพอุปกรณ์' }, { status: 400 });
    }

    // Upload image using storage layer
    let imageUrl = '';
    try {
      imageUrl = await storageService.uploadImage(file);
    } catch (uploadError) {
      console.error('File upload failed:', uploadError);
      return NextResponse.json({ error: 'การอัปโหลดรูปภาพล้มเหลว' }, { status: 500 });
    }

    // Create equipment inside a transaction
    const result = await prisma.$transaction(async (tx) => {
      const equipment = await tx.equipment.create({
        data: {
          name: name.trim(),
          imageUrl,
          totalQuantity: initialQuantity,
          availableQuantity: initialQuantity,
          inUseQuantity: 0,
          unavailableQuantity: 0,
        },
      });

      // If initial stock is greater than 0, record adjustment
      if (initialQuantity > 0) {
        await tx.inventoryAdjustment.create({
          data: {
            equipmentId: equipment.id,
            performedBy: session.user.id,
            adjustmentType: 'ADD_STOCK',
            quantity: initialQuantity,
            reason: 'เพิ่มอุปกรณ์ใหม่เข้าคลัง',
          },
        });
      }

      return equipment;
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('Create equipment api error:', error);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดของระบบ' }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (id) {
      const equipment = await prisma.equipment.findUnique({
        where: { id },
        include: {
          borrows: {
            where: { status: 'OUTSTANDING' },
            include: {
              borrower: { select: { displayName: true } },
              event: { select: { name: true } },
              returns: {
                select: {
                  returnedQuantity: true,
                  unavailableQuantity: true,
                }
              }
            },
            orderBy: { createdAt: 'desc' },
          }
        }
      });

      if (!equipment || equipment.deletedAt) {
        return NextResponse.json({ error: 'ไม่พบอุปกรณ์' }, { status: 404 });
      }

      // Calculate cumulative returned/unavailable to return outstanding quantity directly
      const borrowsWithOutstanding = equipment.borrows.map((borrow) => {
        const totalResolved = borrow.returns.reduce(
          (sum, ret) => sum + ret.returnedQuantity + ret.unavailableQuantity,
          0
        );
        return {
          id: borrow.id,
          borrowedBy: borrow.borrower.displayName,
          eventId: borrow.eventId,
          eventName: borrow.event?.name || null,
          quantity: borrow.quantity,
          outstandingQuantity: borrow.quantity - totalResolved,
          purposeType: borrow.purposeType,
          purposeNote: borrow.purposeNote,
          borrowedAt: borrow.borrowedAt,
        };
      });

      return NextResponse.json({
        ...equipment,
        borrows: borrowsWithOutstanding.filter((b) => b.outstandingQuantity > 0),
      });
    }

    // Fetch all active equipment
    const list = await prisma.equipment.findMany({
      where: { deletedAt: null },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json(list);
  } catch (error) {
    console.error('Fetch equipment api error:', error);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดของระบบ' }, { status: 500 });
  }
}

