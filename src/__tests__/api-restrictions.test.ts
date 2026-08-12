import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST as postEquipment } from '@/app/api/equipment/route';
import { POST as postAdjust } from '@/app/api/equipment/adjust/route';
import { POST as postEvent, PUT as putEvent } from '@/app/api/events/route';
import { getServerSession } from 'next-auth';

// Mock next-auth
vi.mock('next-auth', () => ({
  getServerSession: vi.fn(),
}));

describe('API Authorization Constraints', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  const mockRequest = () => new Request('http://localhost/api', { method: 'POST' });

  describe('/api/equipment POST (Add Equipment)', () => {
    it('should return 403 Forbidden if user is STAFF', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: { id: 'user-1', role: 'STAFF', email: 'staff@example.com' },
      });

      const res = await postEquipment(mockRequest());
      expect(res.status).toBe(403);
      const body = await res.json();
      expect(body.error).toBe('Forbidden');
    });

    it('should return 403 Forbidden if user is unauthorized (no session)', async () => {
      vi.mocked(getServerSession).mockResolvedValue(null);

      const res = await postEquipment(mockRequest());
      expect(res.status).toBe(403);
      const body = await res.json();
      expect(body.error).toBe('Forbidden');
    });
  });

  describe('/api/equipment/adjust POST (Stock Adjustment)', () => {
    it('should return 403 Forbidden if user is STAFF', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: { id: 'user-1', role: 'STAFF', email: 'staff@example.com' },
      });

      const res = await postAdjust(mockRequest());
      expect(res.status).toBe(403);
      const body = await res.json();
      expect(body.error).toBe('Forbidden');
    });
  });

  describe('/api/events POST (Create Event)', () => {
    it('should return 403 Forbidden if user is STAFF', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: { id: 'user-1', role: 'STAFF', email: 'staff@example.com' },
      });

      const res = await postEvent(mockRequest());
      expect(res.status).toBe(403);
      const body = await res.json();
      expect(body.error).toBe('Forbidden');
    });
  });

  describe('/api/events PUT (Complete/Edit Event)', () => {
    it('should return 403 Forbidden if user is STAFF', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: { id: 'user-1', role: 'STAFF', email: 'staff@example.com' },
      });

      const res = await putEvent(mockRequest());
      expect(res.status).toBe(403);
      const body = await res.json();
      expect(body.error).toBe('Forbidden');
    });
  });
});
