import { Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../db/db';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-123';

export async function login(req: AuthenticatedRequest, res: Response) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    const user = await db.getUserByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Sign JWT
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Fetch faculty details if role is faculty
    let facultyDetails = null;
    if (user.role === 'faculty') {
      facultyDetails = await db.getFacultyById(user.id);
    }

    return res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        faculty: facultyDetails
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getProfile(req: AuthenticatedRequest, res: Response) {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const user = await db.getUserByEmail(req.user.email);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    let facultyDetails = null;
    if (user.role === 'faculty') {
      facultyDetails = await db.getFacultyById(user.id);
    }

    return res.json({
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        faculty: facultyDetails
      }
    });
  } catch (err) {
    console.error('Get profile error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function updateProfile(req: AuthenticatedRequest, res: Response) {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { name, department, designation, skills } = req.body;

  try {
    if (req.user.role !== 'faculty') {
      return res.status(400).json({ error: 'Only faculty profiles can be updated' });
    }

    // Validate consolidated departments
    if (department && !['CSA', 'CSE', 'AI & ML'].includes(department)) {
      return res.status(400).json({ error: 'Invalid department. Must be CSA, CSE, or AI & ML' });
    }

    const updated = await db.updateFaculty(req.user.id, name, department, designation, skills);
    if (!updated) {
      return res.status(404).json({ error: 'Faculty details not found' });
    }

    return res.json({ message: 'Profile updated successfully', faculty: updated });
  } catch (err) {
    console.error('Update profile error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function changePassword(req: AuthenticatedRequest, res: Response) {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Current password and new password are required' });
  }

  try {
    const user = await db.getUserByEmail(req.user.email);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isMatch) {
      return res.status(400).json({ error: 'Incorrect current password' });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await db.updateUserPassword(req.user.email, passwordHash);

    return res.json({ message: 'Password updated successfully' });
  } catch (err) {
    console.error('Change password error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
