import { Response } from 'express';
import { db } from '../db/db';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

// Helper to get slot based on time
export function getCurrentSlot(dateObj: Date = new Date()): string {
  const hours = dateObj.getHours();
  
  if (hours >= 9 && hours < 10) return '9:00 – 10:00';
  if (hours >= 10 && hours < 11) return '10:00 – 11:00';
  if (hours >= 11 && hours < 12) return '11:00 – 12:00';
  if (hours >= 12 && hours < 13) return '12:00 – 1:00';
  if (hours >= 13 && hours < 14) return '1:00 – 2:00';
  if (hours >= 14 && hours < 15) return '2:00 – 3:00';
  if (hours >= 15 && hours < 16) return '3:00 – 4:00';
  if (hours >= 16 && hours < 17) return '4:00 – 5:00';
  
  return '9:00 – 10:00'; // Default fallback
}

export async function getTodaySchedule(req: AuthenticatedRequest, res: Response) {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const facultyId = req.user.id;
  const dateStr = req.query.date as string || new Date().toISOString().split('T')[0];

  try {
    const records = await db.getFacultyAttendance(facultyId, dateStr, dateStr);
    
    // Generate empty/default slots if not marked
    const SLOTS = [
      '9:00 – 10:00',
      '10:00 – 11:00',
      '11:00 – 12:00',
      '12:00 – 1:00',
      '1:00 – 2:00',
      '2:00 – 3:00',
      '3:00 – 4:00',
      '4:00 – 5:00'
    ];

    const slotsData = SLOTS.map(slot => {
      const existing = records.find(r => r.slot === slot);
      return {
        slot,
        activity: existing ? existing.activity : 'Free',
        remarks: existing ? existing.remarks : '',
        id: existing ? existing.id : null,
        submitted: !!existing
      };
    });

    return res.json({
      date: dateStr,
      faculty_id: facultyId,
      slots: slotsData,
      isSubmitted: records.length > 0
    });
  } catch (err) {
    console.error('Get today schedule error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function submitTodaySchedule(req: AuthenticatedRequest, res: Response) {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const facultyId = req.user.id;
  const { date, slots } = req.body; // Expect date: string, slots: { slot: string, activity: string, remarks: string }[]

  if (!date || !slots || !Array.isArray(slots)) {
    return res.status(400).json({ error: 'Date and slots array are required' });
  }

  try {
    const success = await db.submitAttendance(facultyId, date, slots);
    if (!success) {
      return res.status(500).json({ error: 'Failed to save attendance' });
    }
    return res.json({ message: 'Attendance submitted successfully' });
  } catch (err) {
    console.error('Submit today schedule error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getRealTimeAvailability(req: AuthenticatedRequest, res: Response) {
  const dateStr = req.query.date as string || new Date().toISOString().split('T')[0];
  const slotStr = req.query.slot as string || getCurrentSlot();

  try {
    const facultyList = await db.getFacultyList();
    const attendanceRecords = await db.getAttendanceForDate(dateStr);

    // Filter attendance for the chosen slot
    const slotAttendance = attendanceRecords.filter(a => a.slot === slotStr);

    const facultyAvailability = facultyList.map(fac => {
      const att = slotAttendance.find(a => a.faculty_id === fac.faculty_id);
      
      // If there is any attendance today, we know they marked their schedule.
      const hasMarkedToday = attendanceRecords.some(a => a.faculty_id === fac.faculty_id);

      return {
        faculty_id: fac.faculty_id,
        employee_id: fac.employee_id,
        name: fac.name,
        department: fac.department,
        designation: fac.designation,
        skills: fac.skills,
        email: fac.email,
        hasMarkedToday,
        activity: att ? att.activity : (hasMarkedToday ? 'Free' : 'Unmarked'), // Fallback if marked today but slot not specified
        remarks: att ? att.remarks : ''
      };
    });

    return res.json({
      date: dateStr,
      slot: slotStr,
      facultyAvailability
    });
  } catch (err) {
    console.error('Get real time availability error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
