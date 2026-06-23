import fs from 'fs';
import path from 'path';
import { Pool } from 'pg';
import bcrypt from 'bcryptjs';

// Define DB Interfaces
export interface User {
  id: string;
  email: string;
  password_hash: string;
  role: 'admin' | 'faculty';
}

export interface Faculty {
  faculty_id: string;
  employee_id: string;
  name: string;
  department: 'CSA' | 'CSE' | 'AI & ML';
  designation: string;
  skills: string; // Comma-separated or JSON
  email: string;
}

export interface AttendanceRecord {
  id: string;
  faculty_id: string;
  date: string; // YYYY-MM-DD
  slot: string; // e.g. "9:00 – 10:00"
  activity: 'Teaching' | 'Office Work' | 'Research' | 'Meeting' | 'Free' | 'Other';
  remarks: string;
}

export interface Department {
  id: string;
  name: string;
}

export interface Semester {
  id: string;
  semester_name: string;
}

// Check for PG URL
const pgUrl = process.env.DATABASE_URL;
let pool: Pool | null = null;
const isPg = !!pgUrl;

const JSON_DB_DIR = path.join(__dirname, '../../data');
const JSON_DB_PATH = path.join(JSON_DB_DIR, 'db.json');

// Memory/JSON DB structure
interface JsonDbSchema {
  users: User[];
  faculty: Faculty[];
  attendance: AttendanceRecord[];
  departments: Department[];
  semesters: Semester[];
}

let jsonDb: JsonDbSchema = {
  users: [],
  faculty: [],
  attendance: [],
  departments: [],
  semesters: []
};

// Seed Constants
const DEPARTMENTS = ['CSA', 'CSE', 'AI & ML'];
const SEMESTERS = ['Spring 2026', 'Fall 2026'];
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
const ACTIVITIES: ('Teaching' | 'Office Work' | 'Research' | 'Meeting' | 'Free' | 'Other')[] = [
  'Teaching',
  'Office Work',
  'Research',
  'Meeting',
  'Free',
  'Other'
];

// Helper to save JSON DB
function saveJsonDb() {
  if (!isPg) {
    if (!fs.existsSync(JSON_DB_DIR)) {
      fs.mkdirSync(JSON_DB_DIR, { recursive: true });
    }
    fs.writeFileSync(JSON_DB_PATH, JSON.stringify(jsonDb, null, 2), 'utf-8');
  }
}

// Generate 30 days of mock attendance
function generateMockAttendance(facultyList: Faculty[]): AttendanceRecord[] {
  const records: AttendanceRecord[] = [];
  const today = new Date();
  
  // Seed for past 30 days
  for (let i = 0; i < 30; i++) {
    const currentDate = new Date(today);
    currentDate.setDate(today.getDate() - i);
    
    // Skip weekends for realistic attendance (optional, but let's keep it simple)
    const dayOfWeek = currentDate.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) continue;

    const dateStr = currentDate.toISOString().split('T')[0];

    facultyList.forEach((fac, facIndex) => {
      // 90% chance faculty submitted attendance on any given weekday
      const submitted = Math.random() < 0.90;
      if (!submitted && i > 0) return; // Leave today unmarked sometimes, but historical mostly marked

      SLOTS.forEach((slot, slotIdx) => {
        // Determine activity based on some patterns
        let activity: typeof ACTIVITIES[number] = 'Free';
        let remarks = '';

        // Random but realistic scheduling
        const rand = Math.random();
        if (rand < 0.4) {
          activity = 'Teaching';
          remarks = `Teaching B.Tech / MCA class - Section ${String.fromCharCode(65 + (facIndex % 3))}`;
        } else if (rand < 0.55) {
          activity = 'Office Work';
          remarks = 'Grading papers / Curriculum updates';
        } else if (rand < 0.7) {
          activity = 'Research';
          remarks = 'Writing research paper on AI models';
        } else if (rand < 0.8) {
          activity = 'Meeting';
          remarks = 'Departmental meeting / Student advisory';
        } else if (rand < 0.95) {
          activity = 'Free';
          remarks = 'Available in cabin';
        } else {
          activity = 'Other';
          remarks = 'Lab supervision / Workshop';
        }

        records.push({
          id: `att-${fac.faculty_id}-${dateStr}-${slotIdx}`,
          faculty_id: fac.faculty_id,
          date: dateStr,
          slot,
          activity,
          remarks
        });
      });
    });
  }
  return records;
}

// Initialize Database
export async function initDb() {
  if (isPg) {
    console.log('Connecting to PostgreSQL database...');
    pool = new Pool({ connectionString: pgUrl });
    
    // Create tables
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(50) CHECK (role IN ('admin', 'faculty')) NOT NULL
      );

      CREATE TABLE IF NOT EXISTS faculty (
        faculty_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        employee_id VARCHAR(100) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        department VARCHAR(50) CHECK (department IN ('CSA', 'CSE', 'AI & ML')) NOT NULL,
        designation VARCHAR(100) NOT NULL,
        skills TEXT NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL
      );

      CREATE TABLE IF NOT EXISTS attendance (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        faculty_id UUID REFERENCES faculty(faculty_id) ON DELETE CASCADE,
        date DATE NOT NULL,
        slot VARCHAR(50) NOT NULL,
        activity VARCHAR(50) CHECK (activity IN ('Teaching', 'Office Work', 'Research', 'Meeting', 'Free', 'Other')) NOT NULL,
        remarks TEXT,
        UNIQUE (faculty_id, date, slot)
      );

      CREATE TABLE IF NOT EXISTS departments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(100) UNIQUE NOT NULL
      );

      CREATE TABLE IF NOT EXISTS semesters (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        semester_name VARCHAR(100) UNIQUE NOT NULL
      );
    `);

    // Seed if empty
    const userCount = await pool.query('SELECT COUNT(*) FROM users');
    if (parseInt(userCount.rows[0].count) === 0) {
      console.log('Seeding PostgreSQL database...');
      const adminPassHash = await bcrypt.hash('password123', 10);
      const facultyPassHash = await bcrypt.hash('password123', 10);

      // Seed departments & semesters
      await pool.query(`INSERT INTO departments (name) VALUES ('CSA'), ('CSE'), ('AI & ML') ON CONFLICT DO NOTHING`);
      await pool.query(`INSERT INTO semesters (semester_name) VALUES ('Spring 2026'), ('Fall 2026') ON CONFLICT DO NOTHING`);

      // Create Admin/Dean
      await pool.query(
        `INSERT INTO users (email, password_hash, role) VALUES ($1, $2, $3)`,
        ['dean@college.edu', adminPassHash, 'admin']
      );

      // Create Faculty
      const sampleFaculty = [
        { empId: 'EMP001', name: 'Dr. Amit Sharma', dept: 'CSE', desig: 'Professor', skills: 'React, Node.js, Systems Architecture', email: 'amit.cse@college.edu' },
        { empId: 'EMP002', name: 'Dr. Priya Patel', dept: 'CSE', desig: 'Associate Professor', skills: 'Algorithms, Java, Cloud Computing', email: 'priya.cse@college.edu' },
        { empId: 'EMP003', name: 'Dr. John Doe', dept: 'CSA', desig: 'Assistant Professor', skills: 'Python, DBMS, Web Tech', email: 'john.csa@college.edu' },
        { empId: 'EMP004', name: 'Dr. Sarah Connor', dept: 'AI & ML', desig: 'Professor', skills: 'Machine Learning, PyTorch, Statistics', email: 'sarah.ai@college.edu' },
        { empId: 'EMP005', name: 'Dr. Alan Turing', dept: 'AI & ML', desig: 'Professor', skills: 'Deep Learning, NLP, Data Structures', email: 'alan.ai@college.edu' },
        { empId: 'EMP006', name: 'Prof. Grace Hopper', dept: 'CSA', desig: 'Associate Professor', skills: 'COBOL, Compiler Design, SQL', email: 'grace.csa@college.edu' },
        { empId: 'EMP007', name: 'Dr. Ada Lovelace', dept: 'CSE', desig: 'Professor', skills: 'Analytical Engine, Logic, Cryptography', email: 'ada.cse@college.edu' }
      ];

      for (const fac of sampleFaculty) {
        const uRes = await pool.query(
          `INSERT INTO users (email, password_hash, role) VALUES ($1, $2, $3) RETURNING id`,
          [fac.email, facultyPassHash, 'faculty']
        );
        const userId = uRes.rows[0].id;
        
        await pool.query(
          `INSERT INTO faculty (faculty_id, employee_id, name, department, designation, skills, email) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [userId, fac.empId, fac.name, fac.dept, fac.desig, fac.skills, fac.email]
        );
      }

      // Query seeded faculty to generate attendance
      const facultyRows = await pool.query('SELECT faculty_id, employee_id, name, department, designation, skills, email FROM faculty');
      const seededFaculty: Faculty[] = facultyRows.rows;
      const attRecords = generateMockAttendance(seededFaculty);

      for (const record of attRecords) {
        await pool.query(
          `INSERT INTO attendance (faculty_id, date, slot, activity, remarks) VALUES ($1, $2, $3, $4, $5)`,
          [record.faculty_id, record.date, record.slot, record.activity, record.remarks]
        );
      }
      console.log('PostgreSQL seeding complete!');
    }
  } else {
    console.log('No DATABASE_URL found. Initializing JSON file database fallback...');
    if (fs.existsSync(JSON_DB_PATH)) {
      try {
        jsonDb = JSON.parse(fs.readFileSync(JSON_DB_PATH, 'utf-8'));
        console.log('Loaded JSON database successfully.');
      } catch (err) {
        console.error('Error reading JSON DB, re-initializing...', err);
        await reseedJsonDb();
      }
    } else {
      await reseedJsonDb();
    }
  }
}

async function reseedJsonDb() {
  console.log('Seeding JSON database...');
  const adminPassHash = await bcrypt.hash('password123', 10);
  const facultyPassHash = await bcrypt.hash('password123', 10);

  // Departments
  const departments: Department[] = DEPARTMENTS.map((name, i) => ({
    id: `dept-${i + 1}`,
    name
  }));

  // Semesters
  const semesters: Semester[] = SEMESTERS.map((semester_name, i) => ({
    id: `sem-${i + 1}`,
    semester_name
  }));

  // Users
  const users: User[] = [
    { id: 'user-admin-1', email: 'dean@college.edu', password_hash: adminPassHash, role: 'admin' }
  ];

  // Faculty
  const sampleFaculty = [
    { empId: 'EMP001', name: 'Dr. Amit Sharma', dept: 'CSE' as const, desig: 'Professor', skills: 'React, Node.js, Systems Architecture', email: 'amit.cse@college.edu' },
    { empId: 'EMP002', name: 'Dr. Priya Patel', dept: 'CSE' as const, desig: 'Associate Professor', skills: 'Algorithms, Java, Cloud Computing', email: 'priya.cse@college.edu' },
    { empId: 'EMP003', name: 'Dr. John Doe', dept: 'CSA' as const, desig: 'Assistant Professor', skills: 'Python, DBMS, Web Tech', email: 'john.csa@college.edu' },
    { empId: 'EMP004', name: 'Dr. Sarah Connor', dept: 'AI & ML' as const, desig: 'Professor', skills: 'Machine Learning, PyTorch, Statistics', email: 'sarah.ai@college.edu' },
    { empId: 'EMP005', name: 'Dr. Alan Turing', dept: 'AI & ML' as const, desig: 'Professor', skills: 'Deep Learning, NLP, Data Structures', email: 'alan.ai@college.edu' },
    { empId: 'EMP006', name: 'Prof. Grace Hopper', dept: 'CSA' as const, desig: 'Associate Professor', skills: 'COBOL, Compiler Design, SQL', email: 'grace.csa@college.edu' },
    { empId: 'EMP007', name: 'Dr. Ada Lovelace', dept: 'CSE' as const, desig: 'Professor', skills: 'Analytical Engine, Logic, Cryptography', email: 'ada.cse@college.edu' }
  ];

  const faculty: Faculty[] = sampleFaculty.map((fac, i) => {
    const fId = `fac-${i + 1}`;
    users.push({
      id: fId,
      email: fac.email,
      password_hash: facultyPassHash,
      role: 'faculty'
    });

    return {
      faculty_id: fId,
      employee_id: fac.empId,
      name: fac.name,
      department: fac.dept,
      designation: fac.desig,
      skills: fac.skills,
      email: fac.email
    };
  });

  const attendance = generateMockAttendance(faculty);

  jsonDb = {
    users,
    faculty,
    attendance,
    departments,
    semesters
  };

  saveJsonDb();
  console.log('JSON database seeding complete!');
}

// Database Repository Wrapper
export const db = {
  // USER METHODS
  async getUserByEmail(email: string): Promise<User | null> {
    if (isPg) {
      const res = await pool!.query('SELECT * FROM users WHERE email = $1', [email]);
      return res.rows[0] || null;
    } else {
      return jsonDb.users.find(u => u.email.toLowerCase() === email.toLowerCase()) || null;
    }
  },

  async createUser(email: string, passwordHash: string, role: 'admin' | 'faculty', customId?: string): Promise<User> {
    if (isPg) {
      const res = await pool!.query(
        'INSERT INTO users (email, password_hash, role) VALUES ($1, $2, $3) RETURNING *',
        [email, passwordHash, role]
      );
      return res.rows[0];
    } else {
      const newUser: User = {
        id: customId || `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        email,
        password_hash: passwordHash,
        role
      };
      jsonDb.users.push(newUser);
      saveJsonDb();
      return newUser;
    }
  },

  async updateUserPassword(email: string, passwordHash: string): Promise<boolean> {
    if (isPg) {
      const res = await pool!.query('UPDATE users SET password_hash = $1 WHERE email = $2', [passwordHash, email]);
      return (res.rowCount ?? 0) > 0;
    } else {
      const user = jsonDb.users.find(u => u.email.toLowerCase() === email.toLowerCase());
      if (user) {
        user.password_hash = passwordHash;
        saveJsonDb();
        return true;
      }
      return false;
    }
  },

  // FACULTY METHODS
  async getFacultyList(): Promise<Faculty[]> {
    if (isPg) {
      const res = await pool!.query('SELECT * FROM faculty');
      return res.rows;
    } else {
      return jsonDb.faculty;
    }
  },

  async getFacultyById(faculty_id: string): Promise<Faculty | null> {
    if (isPg) {
      const res = await pool!.query('SELECT * FROM faculty WHERE faculty_id = $1', [faculty_id]);
      return res.rows[0] || null;
    } else {
      return jsonDb.faculty.find(f => f.faculty_id === faculty_id) || null;
    }
  },

  async getFacultyByEmail(email: string): Promise<Faculty | null> {
    if (isPg) {
      const res = await pool!.query('SELECT * FROM faculty WHERE email = $1', [email]);
      return res.rows[0] || null;
    } else {
      return jsonDb.faculty.find(f => f.email.toLowerCase() === email.toLowerCase()) || null;
    }
  },

  async createFaculty(
    faculty_id: string,
    employee_id: string,
    name: string,
    department: 'CSA' | 'CSE' | 'AI & ML',
    designation: string,
    skills: string,
    email: string
  ): Promise<Faculty> {
    if (isPg) {
      const res = await pool!.query(
        'INSERT INTO faculty (faculty_id, employee_id, name, department, designation, skills, email) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
        [faculty_id, employee_id, name, department, designation, skills, email]
      );
      return res.rows[0];
    } else {
      const newFaculty: Faculty = {
        faculty_id,
        employee_id,
        name,
        department,
        designation,
        skills,
        email
      };
      jsonDb.faculty.push(newFaculty);
      saveJsonDb();
      return newFaculty;
    }
  },

  async updateFaculty(
    faculty_id: string,
    name: string,
    department: 'CSA' | 'CSE' | 'AI & ML',
    designation: string,
    skills: string
  ): Promise<Faculty | null> {
    if (isPg) {
      const res = await pool!.query(
        'UPDATE faculty SET name = $1, department = $2, designation = $3, skills = $4 WHERE faculty_id = $5 RETURNING *',
        [name, department, designation, skills, faculty_id]
      );
      return res.rows[0] || null;
    } else {
      const index = jsonDb.faculty.findIndex(f => f.faculty_id === faculty_id);
      if (index !== -1) {
        jsonDb.faculty[index] = {
          ...jsonDb.faculty[index],
          name,
          department,
          designation,
          skills
        };
        saveJsonDb();
        return jsonDb.faculty[index];
      }
      return null;
    }
  },

  async deleteFaculty(faculty_id: string): Promise<boolean> {
    if (isPg) {
      await pool!.query('DELETE FROM users WHERE id = $1', [faculty_id]);
      const res = await pool!.query('DELETE FROM faculty WHERE faculty_id = $1', [faculty_id]);
      return (res.rowCount ?? 0) > 0;
    } else {
      const fIndex = jsonDb.faculty.findIndex(f => f.faculty_id === faculty_id);
      const uIndex = jsonDb.users.findIndex(u => u.id === faculty_id);
      
      if (fIndex !== -1) {
        // Remove attendance for this faculty as well
        jsonDb.attendance = jsonDb.attendance.filter(a => a.faculty_id !== faculty_id);
        jsonDb.faculty.splice(fIndex, 1);
        if (uIndex !== -1) {
          jsonDb.users.splice(uIndex, 1);
        }
        saveJsonDb();
        return true;
      }
      return false;
    }
  },

  // ATTENDANCE METHODS
  async getAttendanceForDate(date: string): Promise<AttendanceRecord[]> {
    if (isPg) {
      const res = await pool!.query('SELECT * FROM attendance WHERE date = $1', [date]);
      // Normalize dates from DB to string YYYY-MM-DD
      return res.rows.map(row => ({
        ...row,
        date: row.date instanceof Date ? row.date.toISOString().split('T')[0] : row.date
      }));
    } else {
      return jsonDb.attendance.filter(a => a.date === date);
    }
  },

  async getFacultyAttendance(faculty_id: string, startDate?: string, endDate?: string): Promise<AttendanceRecord[]> {
    if (isPg) {
      let query = 'SELECT * FROM attendance WHERE faculty_id = $1';
      const params: any[] = [faculty_id];
      
      if (startDate) {
        query += ' AND date >= $2';
        params.push(startDate);
      }
      if (endDate) {
        query += ` AND date <= $${params.length + 1}`;
        params.push(endDate);
      }
      query += ' ORDER BY date DESC';
      const res = await pool!.query(query, params);
      return res.rows.map(row => ({
        ...row,
        date: row.date instanceof Date ? row.date.toISOString().split('T')[0] : row.date
      }));
    } else {
      return jsonDb.attendance.filter(a => {
        if (a.faculty_id !== faculty_id) return false;
        if (startDate && a.date < startDate) return false;
        if (endDate && a.date > endDate) return false;
        return true;
      });
    }
  },

  async submitAttendance(
    faculty_id: string,
    date: string,
    slots: { slot: string; activity: typeof ACTIVITIES[number]; remarks: string }[]
  ): Promise<boolean> {
    if (isPg) {
      const client = await pool!.connect();
      try {
        await client.query('BEGIN');
        // Delete existing attendance for this faculty and date
        await client.query('DELETE FROM attendance WHERE faculty_id = $1 AND date = $2', [faculty_id, date]);
        
        // Insert new records
        for (const slot of slots) {
          await client.query(
            'INSERT INTO attendance (faculty_id, date, slot, activity, remarks) VALUES ($1, $2, $3, $4, $5)',
            [faculty_id, date, slot.slot, slot.activity, slot.remarks]
          );
        }
        await client.query('COMMIT');
        return true;
      } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error submitting PG attendance', err);
        return false;
      } finally {
        client.release();
      }
    } else {
      // Remove old records
      jsonDb.attendance = jsonDb.attendance.filter(a => !(a.faculty_id === faculty_id && a.date === date));
      
      // Add new records
      slots.forEach((slot, idx) => {
        jsonDb.attendance.push({
          id: `att-${faculty_id}-${date}-${idx}-${Date.now()}`,
          faculty_id,
          date,
          slot: slot.slot,
          activity: slot.activity,
          remarks: slot.remarks
        });
      });
      
      saveJsonDb();
      return true;
    }
  },

  // UTILS
  async getDepartments(): Promise<Department[]> {
    if (isPg) {
      const res = await pool!.query('SELECT * FROM departments');
      return res.rows;
    } else {
      return jsonDb.departments;
    }
  },

  async getSemesters(): Promise<Semester[]> {
    if (isPg) {
      const res = await pool!.query('SELECT * FROM semesters');
      return res.rows;
    } else {
      return jsonDb.semesters;
    }
  },

  async createSemester(name: string): Promise<Semester> {
    if (isPg) {
      const res = await pool!.query('INSERT INTO semesters (semester_name) VALUES ($1) ON CONFLICT (semester_name) DO UPDATE SET semester_name = EXCLUDED.semester_name RETURNING *', [name]);
      return res.rows[0];
    } else {
      const existing = jsonDb.semesters.find(s => s.semester_name.toLowerCase() === name.toLowerCase());
      if (existing) return existing;
      const newSem = { id: `sem-${Date.now()}`, semester_name: name };
      jsonDb.semesters.push(newSem);
      saveJsonDb();
      return newSem;
    }
  }
};
