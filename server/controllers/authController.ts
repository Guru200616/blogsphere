import { Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { DB } from '../config/db';
import { AuthRequest } from '../middleware/auth';
import { UserRole } from '../../src/types';

const JWT_SECRET = process.env.JWT_SECRET || 'blog_sphere_jwt_super_secret_key_2026';

export async function register(req: any, res: Response): Promise<void> {
  const { name, username, email, password, confirmPassword, role } = req.body;

  if (!name || !username || !email || !password || !confirmPassword) {
    res.status(400).json({ message: 'All registration fields are required.' });
    return;
  }

  if (password !== confirmPassword) {
    res.status(400).json({ message: 'Passwords do not match.' });
    return;
  }

  if (password.length < 6) {
    res.status(400).json({ message: 'Password must be at least 6 characters long.' });
    return;
  }

  try {
    // Check if user already exists
    const existingEmail = await DB.users.findOne({ email });
    if (existingEmail) {
      res.status(400).json({ message: 'Email address is already registered.' });
      return;
    }

    const existingUsername = await DB.users.findOne({ username });
    if (existingUsername) {
      res.status(400).json({ message: 'Username is already taken.' });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Default first user to Admin, or fallback to Reader unless specific role requested
    let assignedRole: UserRole = 'Reader';
    if (role && ['Admin', 'Author', 'Reader'].includes(role)) {
      assignedRole = role as UserRole;
    } else {
      // If there are no users in DB, make them Admin
      const allUsers = await DB.users.find();
      if (allUsers.length === 0) {
        assignedRole = 'Admin';
      }
    }

    const userObj = {
      name,
      username: username.toLowerCase().replace(/\s+/g, ''),
      email: email.toLowerCase(),
      password: hashedPassword,
      role: assignedRole,
      avatar: `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(username)}`,
      bio: '',
      followers: [],
      following: [],
      socialLinks: {}
    };

    const createdUser = await DB.users.create(userObj);

    // Create JWT Token
    const token = jwt.sign(
      { id: createdUser.id, email: createdUser.email, role: createdUser.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Omit password hash in response
    const { password: _, ...userWithoutPassword } = createdUser as any;

    res.status(201).json({
      message: 'Account registered successfully!',
      token,
      user: userWithoutPassword
    });
  } catch (err: any) {
    console.error('Registration Error:', err);
    res.status(500).json({ message: 'Internal Server Error during registration.' });
  }
}

export async function login(req: any, res: Response): Promise<void> {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ message: 'Email and password are required.' });
    return;
  }

  try {
    const user = await DB.users.findOne({ email });
    if (!user) {
      res.status(401).json({ message: 'Invalid credentials. User not found.' });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      res.status(401).json({ message: 'Invalid credentials. Password incorrect.' });
      return;
    }

    // Sign JWT
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    const { password: _, ...userWithoutPassword } = user as any;

    res.status(200).json({
      message: 'Login successful!',
      token,
      user: userWithoutPassword
    });
  } catch (err) {
    console.error('Login Error:', err);
    res.status(500).json({ message: 'Internal Server Error during authentication.' });
  }
}

export async function logout(req: any, res: Response): Promise<void> {
  res.status(200).json({ message: 'Logged out successfully.' });
}

export async function forgotPassword(req: any, res: Response): Promise<void> {
  const { email } = req.body;
  if (!email) {
    res.status(400).json({ message: 'Email is required.' });
    return;
  }

  try {
    const user = await DB.users.findOne({ email });
    if (!user) {
      res.status(400).json({ message: 'Email is not registered.' });
      return;
    }

    res.status(200).json({ 
      message: 'Password reset instructions have been dispatched to your email (simulated). Check your inbox.',
      resetToken: 'simulated_token_' + Math.random().toString(36).substring(2, 15)
    });
  } catch (err) {
    res.status(500).json({ message: 'Internal Server Error.' });
  }
}

export async function updatePassword(req: AuthRequest, res: Response): Promise<void> {
  const { oldPassword, newPassword } = req.body;
  if (!req.user) {
    res.status(401).json({ message: 'Unauthenticated.' });
    return;
  }

  try {
    const user = await DB.users.findOne({ id: req.user.id });
    if (!user) {
      res.status(404).json({ message: 'User not found.' });
      return;
    }

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      res.status(401).json({ message: 'Current password is incorrect.' });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await DB.users.update(req.user.id, { password: hashedPassword });
    res.status(200).json({ message: 'Password updated successfully.' });
  } catch (err) {
    res.status(500).json({ message: 'Error updating password.' });
  }
}

export async function getProfile(req: AuthRequest, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ message: 'Unauthenticated.' });
    return;
  }

  try {
    const user = await DB.users.findOne({ id: req.user.id });
    if (!user) {
      res.status(404).json({ message: 'Profile not found.' });
      return;
    }

    const { password: _, ...userWithoutPassword } = user as any;
    res.status(200).json(userWithoutPassword);
  } catch (err) {
    res.status(500).json({ message: 'Internal Server Error querying profile.' });
  }
}

export async function getAuthorProfile(req: any, res: Response): Promise<void> {
  const { id } = req.params;
  try {
    const user = await DB.users.findOne({ id });
    if (!user) {
      res.status(404).json({ message: 'Author not found.' });
      return;
    }

    const { password: _, ...userWithoutPassword } = user as any;
    res.status(200).json(userWithoutPassword);
  } catch (err) {
    res.status(500).json({ message: 'Error retrieving profile.' });
  }
}

export async function updateProfile(req: AuthRequest, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ message: 'Unauthenticated.' });
    return;
  }

  const { name, username, bio, avatar, socialLinks } = req.body;

  try {
    // Validate username changes are unique
    if (username) {
      const sanitizedUsername = username.toLowerCase().replace(/\s+/g, '');
      const existing = await DB.users.findOne({ username: sanitizedUsername });
      if (existing && existing.id !== req.user.id) {
        res.status(400).json({ message: 'Username is already in use by another author.' });
        return;
      }
    }

    const updates: any = {};
    if (name !== undefined) updates.name = name;
    if (username !== undefined) updates.username = username.toLowerCase().replace(/\s+/g, '');
    if (bio !== undefined) updates.bio = bio;
    if (avatar !== undefined) updates.avatar = avatar;
    if (socialLinks !== undefined) updates.socialLinks = socialLinks;

    const updatedUser = await DB.users.update(req.user.id, updates);
    const { password: _, ...userWithoutPassword } = updatedUser as any;

    res.status(200).json({
      message: 'Profile updated successfully!',
      user: userWithoutPassword
    });
  } catch (err) {
    res.status(500).json({ message: 'Error updating profile.' });
  }
}

export async function followAuthor(req: AuthRequest, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ message: 'Unauthenticated.' });
    return;
  }

  const authorId = req.params.id;
  if (req.user.id === authorId) {
    res.status(400).json({ message: 'You cannot follow yourself.' });
    return;
  }

  try {
    const self = await DB.users.findOne({ id: req.user.id });
    const target = await DB.users.findOne({ id: authorId });

    if (!self || !target) {
      res.status(404).json({ message: 'User or target author not found.' });
      return;
    }

    const following = self.following || [];
    const followers = target.followers || [];

    const isFollowing = following.includes(authorId);

    let updatedFollowing;
    let updatedFollowers;

    if (isFollowing) {
      // Unfollow
      updatedFollowing = following.filter((id: string) => id !== authorId);
      updatedFollowers = followers.filter((id: string) => id !== req.user!.id);
    } else {
      // Follow
      updatedFollowing = [...following, authorId];
      updatedFollowers = [...followers, req.user.id];
    }

    const selfUser = await DB.users.update(req.user.id, { following: updatedFollowing });
    await DB.users.update(authorId, { followers: updatedFollowers });

    const { password: _, ...selfWithoutPassword } = selfUser as any;
    res.status(200).json({
      message: isFollowing ? 'Unfollowed author successfully.' : 'Followed author successfully!',
      user: selfWithoutPassword,
      isFollowing: !isFollowing
    });
  } catch (err) {
    res.status(500).json({ message: 'Error toggling search details.' });
  }
}

// ADMIN ACTIONS
export async function getAllUsersAdmin(req: AuthRequest, res: Response): Promise<void> {
  try {
    const list = await DB.users.find();
    // Omit passwords
    const safeList = list.map(({ password, ...u }) => u);
    res.status(200).json(safeList);
  } catch (err) {
    res.status(500).json({ message: 'Error retrieving users.' });
  }
}

export async function updateUserRoleAdmin(req: AuthRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const { role } = req.body;

  if (!['Admin', 'Author', 'Reader'].includes(role)) {
    res.status(400).json({ message: 'Invalid role configuration option.' });
    return;
  }

  try {
    const target = await DB.users.findOne({ id });
    if (!target) {
      res.status(404).json({ message: 'User not found.' });
      return;
    }

    // Prevent self demotion
    if (target.id === req.user!.id) {
      res.status(400).json({ message: 'You cannot change your own administrative role.' });
      return;
    }

    const updated = await DB.users.update(id, { role });
    res.status(200).json({ message: 'User role updated successfully.', user: updated });
  } catch (err) {
    res.status(500).json({ message: 'Error modifying role.' });
  }
}

export async function deleteUserAdmin(req: AuthRequest, res: Response): Promise<void> {
  const { id } = req.params;

  try {
    const target = await DB.users.findOne({ id });
    if (!target) {
      res.status(404).json({ message: 'User not found.' });
      return;
    }

    if (target.id === req.user!.id) {
      res.status(400).json({ message: 'You cannot delete your own administrative account.' });
      return;
    }

    await DB.users.delete(id);
    res.status(200).json({ message: 'User deleted successfully.' });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting user.' });
  }
}
