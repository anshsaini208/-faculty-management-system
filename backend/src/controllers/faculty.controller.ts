import { Response } from 'express';
import bcrypt from 'bcryptjs';
import { db, Faculty } from '../db/db';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

export async function getFacultyList(req: AuthenticatedRequest, res: Response) {
  try {
    const faculty = await db.getFacultyList();
    
    // Parse query params for search, filter, pagination
    const search = (req.query.search as string || '').toLowerCase();
    const department = req.query.department as string || '';
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    let filtered = faculty;

    // Apply department filter
    if (department && department !== 'All') {
      filtered = filtered.filter(f => f.department === department);
    }

    // Apply search filter
    if (search) {
      filtered = filtered.filter(f => 
        f.name.toLowerCase().includes(search) ||
        f.email.toLowerCase().includes(search) ||
        f.employee_id.toLowerCase().includes(search) ||
        f.designation.toLowerCase().includes(search) ||
        f.skills.toLowerCase().includes(search)
      );
    }

    // Pagination
    const total = filtered.length;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const paginated = filtered.slice(startIndex, endIndex);

    return res.json({
      faculty: paginated,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    console.error('Get faculty list error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getFacultyById(req: AuthenticatedRequest, res: Response) {
  const { id } = req.params;

  try {
    const faculty = await db.getFacultyById(id);
    if (!faculty) {
      return res.status(404).json({ error: 'Faculty not found' });
    }
    return res.json(faculty);
  } catch (err) {
    console.error('Get faculty by id error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function addFaculty(req: AuthenticatedRequest, res: Response) {
  const { employee_id, name, email, password, department, designation, skills } = req.body;

  if (!employee_id || !name || !email || !password || !department || !designation) {
    return res.status(400).json({ error: 'All fields except skills are required' });
  }

  // Validate consolidated departments
  if (!['CSA', 'CSE', 'AI & ML'].includes(department)) {
    return res.status(400).json({ error: 'Invalid department. Must be CSA, CSE, or AI & ML' });
  }

  try {
    // Check if user/email already exists
    const existingUser = await db.getUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Check if employee ID already exists
    const facultyList = await db.getFacultyList();
    const existingEmp = facultyList.find(f => f.employee_id.toLowerCase() === employee_id.toLowerCase());
    if (existingEmp) {
      return res.status(400).json({ error: 'Employee ID already exists' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);
    
    // Create user credentials
    const user = await db.createUser(email, passwordHash, 'faculty');
    
    // Create faculty record using user.id as faculty_id
    const faculty = await db.createFaculty(
      user.id,
      employee_id,
      name,
      department,
      designation,
      skills || '',
      email
    );

    return res.status(201).json({ message: 'Faculty created successfully', faculty });
  } catch (err) {
    console.error('Add faculty error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function bulkUploadFaculty(req: AuthenticatedRequest, res: Response) {
  const { facultyList } = req.body; // Expect JSON list of rows parsed from CSV

  if (!facultyList || !Array.isArray(facultyList)) {
    return res.status(400).json({ error: 'Invalid facultyList format. Expecting an array.' });
  }

  try {
    const results = {
      successCount: 0,
      errors: [] as string[]
    };

    const defaultPassword = 'password123'; // Temporary password for bulk uploads
    const passwordHash = await bcrypt.hash(defaultPassword, 10);

    const existingFaculty = await db.getFacultyList();

    for (let i = 0; i < facultyList.length; i++) {
      const row = facultyList[i];
      const { employee_id, name, email, department, designation, skills } = row;

      if (!employee_id || !name || !email || !department || !designation) {
        results.errors.push(`Row ${i + 1}: Missing required fields.`);
        continue;
      }

      // Consolidate department logic
      let normalizedDept = department.trim();
      if (normalizedDept.toUpperCase() === 'BCA' || normalizedDept.toUpperCase() === 'MCA' || normalizedDept.toUpperCase() === 'CSA') {
        normalizedDept = 'CSA';
      } else if (normalizedDept.toUpperCase().includes('B.TECH CSE') || normalizedDept.toUpperCase().includes('M.TECH CSE') || normalizedDept.toUpperCase().includes('DS') || normalizedDept.toUpperCase() === 'CSE') {
        normalizedDept = 'CSE';
      } else if (normalizedDept.toUpperCase().includes('AI') || normalizedDept.toUpperCase().includes('ML') || normalizedDept.toUpperCase().includes('CYBER') || normalizedDept.toUpperCase() === 'AI & ML') {
        normalizedDept = 'AI & ML';
      } else {
        results.errors.push(`Row ${i + 1}: Department "${department}" could not be resolved to CSA, CSE, or AI & ML.`);
        continue;
      }

      // Check if email or employee ID already exists
      const isEmailDup = existingFaculty.some(f => f.email.toLowerCase() === email.toLowerCase().trim());
      const isEmpIdDup = existingFaculty.some(f => f.employee_id.toLowerCase() === employee_id.toLowerCase().trim());

      if (isEmailDup) {
        results.errors.push(`Row ${i + 1}: Email "${email}" is already registered.`);
        continue;
      }

      if (isEmpIdDup) {
        results.errors.push(`Row ${i + 1}: Employee ID "${employee_id}" already exists.`);
        continue;
      }

      try {
        // Create user credentials
        const user = await db.createUser(email.trim(), passwordHash, 'faculty');

        // Create faculty record
        await db.createFaculty(
          user.id,
          employee_id.trim(),
          name.trim(),
          normalizedDept as 'CSA' | 'CSE' | 'AI & ML',
          designation.trim(),
          skills || '',
          email.trim()
        );
        results.successCount++;
      } catch (err: any) {
        results.errors.push(`Row ${i + 1}: Database error - ${err.message}`);
      }
    }

    return res.json({
      message: `Successfully uploaded ${results.successCount} faculty accounts.`,
      successCount: results.successCount,
      errors: results.errors
    });
  } catch (err) {
    console.error('Bulk upload error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function updateFacultyDetails(req: AuthenticatedRequest, res: Response) {
  const { id } = req.params;
  const { name, department, designation, skills } = req.body;

  if (!name || !department || !designation) {
    return res.status(400).json({ error: 'Name, department, and designation are required' });
  }

  if (!['CSA', 'CSE', 'AI & ML'].includes(department)) {
    return res.status(400).json({ error: 'Invalid department. Must be CSA, CSE, or AI & ML' });
  }

  try {
    const updated = await db.updateFaculty(id, name, department, designation, skills || '');
    if (!updated) {
      return res.status(404).json({ error: 'Faculty not found' });
    }
    return res.json({ message: 'Faculty updated successfully', faculty: updated });
  } catch (err) {
    console.error('Update faculty error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function deleteFacultyAccount(req: AuthenticatedRequest, res: Response) {
  const { id } = req.params;

  try {
    const success = await db.deleteFaculty(id);
    if (!success) {
      return res.status(404).json({ error: 'Faculty not found' });
    }
    return res.json({ message: 'Faculty account deleted successfully' });
  } catch (err) {
    console.error('Delete faculty error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getSemestersList(req: AuthenticatedRequest, res: Response) {
  try {
    const semesters = await db.getSemesters();
    return res.json(semesters);
  } catch (err) {
    console.error('Get semesters error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function createSemesterName(req: AuthenticatedRequest, res: Response) {
  const { semester_name } = req.body;
  if (!semester_name) {
    return res.status(400).json({ error: 'Semester name is required' });
  }

  try {
    const semester = await db.createSemester(semester_name);
    return res.status(201).json(semester);
  } catch (err) {
    console.error('Create semester error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
