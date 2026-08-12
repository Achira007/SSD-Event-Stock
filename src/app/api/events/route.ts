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
    const id = searchParams.get('id');
    const active = searchParams.get('active');

    // Fetch current active event
    if (active === 'true') {
      const activeEvent = await prisma.event.findFirst({
        where: { status: 'ACTIVE' },
      });
      return NextResponse.json(activeEvent || null);
    }

    // Fetch specific event details and its borrow records
    if (id) {
      const event = await prisma.event.findUnique({
        where: { id },
        include: {
          borrows: {
            include: {
              equipment: { select: { name: true, imageUrl: true } },
              borrower: { select: { displayName: true } },
              returns: {
                select: {
                  returnedQuantity: true,
                  unavailableQuantity: true,
                },
              },
            },
            orderBy: { createdAt: 'desc' },
          },
        },
      });

      if (!event) {
        return NextResponse.json({ error: 'ไม่พบงานดังกล่าว' }, { status: 404 });
      }

      // Calculate outstanding quantities for each borrow record
      const borrowsWithOutstanding = event.borrows.map((borrow) => {
        const totalResolved = borrow.returns.reduce(
          (sum, ret) => sum + ret.returnedQuantity + ret.unavailableQuantity,
          0
        );
        return {
          id: borrow.id,
          equipmentName: borrow.equipment.name,
          equipmentImageUrl: borrow.equipment.imageUrl,
          borrowedBy: borrow.borrower.displayName,
          quantity: borrow.quantity,
          outstandingQuantity: borrow.quantity - totalResolved,
          status: borrow.status,
          borrowedAt: borrow.borrowedAt,
        };
      });

      return NextResponse.json({
        ...event,
        borrows: borrowsWithOutstanding,
      });
    }

    // Fetch all events
    const events = await prisma.event.findMany({
      orderBy: { startAt: 'desc' },
    });

    return NextResponse.json(events);
  } catch (error) {
    console.error('Fetch events API error:', error);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดของระบบ' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const { name, description, startAt } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'กรุณากรอกชื่องาน' }, { status: 400 });
    }

    if (!startAt) {
      return NextResponse.json({ error: 'กรุณาระบุวันเริ่มงาน' }, { status: 400 });
    }

    // Enforce rule: Only one active event can exist
    const activeEvent = await prisma.event.findFirst({
      where: { status: 'ACTIVE' },
    });

    if (activeEvent) {
      return NextResponse.json(
        { error: `ไม่สามารถสร้างงานใหม่ได้เนื่องจากมีงาน "${activeEvent.name}" ที่ยังดำเนินการอยู่` },
        { status: 400 }
      );
    }

    const event = await prisma.event.create({
      data: {
        name: name.trim(),
        description: description ? description.trim() : null,
        startAt: new Date(startAt),
        status: 'ACTIVE',
        createdBy: session.user.id,
      },
    });

    return NextResponse.json(event, { status: 201 });
  } catch (error) {
    console.error('Create event API error:', error);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดของระบบ' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const { id, action } = body;

    if (!id) {
      return NextResponse.json({ error: 'ไม่พบรหัสงาน' }, { status: 400 });
    }

    const event = await prisma.event.findUnique({
      where: { id },
    });

    if (!event) {
      return NextResponse.json({ error: 'ไม่พบข้อมูลงาน' }, { status: 404 });
    }

    if (action === 'complete') {
      if (event.status === 'COMPLETED') {
        return NextResponse.json({ error: 'งานนี้ได้เสร็จสิ้นไปแล้ว' }, { status: 400 });
      }

      // Check if there is outstanding equipment linked to this event for warning check
      const outstandingBorrows = await prisma.borrowRecord.findMany({
        where: {
          eventId: id,
          status: 'OUTSTANDING',
        },
      });

      const hasOutstanding = outstandingBorrows.length > 0;

      // Update event status to COMPLETED
      const updatedEvent = await prisma.event.update({
        where: { id },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
          endAt: new Date(),
        },
      });

      return NextResponse.json({
        success: true,
        event: updatedEvent,
        wasOutstandingWarning: hasOutstanding,
      });
    } else if (action === 'edit') {
      const { name, description, startAt } = body;

      if (!name || !name.trim()) {
        return NextResponse.json({ error: 'กรุณากรอกชื่องาน' }, { status: 400 });
      }

      if (!startAt) {
        return NextResponse.json({ error: 'กรุณาระบุวันเริ่มงาน' }, { status: 400 });
      }

      const updatedEvent = await prisma.event.update({
        where: { id },
        data: {
          name: name.trim(),
          description: description ? description.trim() : null,
          startAt: new Date(startAt),
        },
      });

      return NextResponse.json({ success: true, event: updatedEvent });
    }

    return NextResponse.json({ error: 'คำสั่งไม่ถูกต้อง' }, { status: 400 });
  } catch (error) {
    console.error('Update event API error:', error);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดของระบบ' }, { status: 500 });
  }
}
