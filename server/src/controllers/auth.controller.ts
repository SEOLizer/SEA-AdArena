import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { User } from '../models/index';
import type { AuthPayload } from '../types/express';

const BCRYPT_ROUNDS = 10;
const JWT_EXPIRES   = '7d';

function signToken(user: { id: number; role: 'admin' | 'trainee'; username: string }): string {
  const payload: AuthPayload = { userId: user.id, role: user.role, username: user.username };
  return jwt.sign(payload, process.env.JWT_SECRET!, { expiresIn: JWT_EXPIRES });
}

export async function register(req: Request, res: Response): Promise<void> {
  const { username, email, password } = req.body as Record<string, string>;

  if (!username || !email || !password) {
    res.status(400).json({ message: 'username, email und password sind erforderlich' });
    return;
  }

  const existing = await User.findOne({ where: { email } });
  if (existing) {
    res.status(409).json({ message: 'E-Mail bereits registriert' });
    return;
  }

  const usernameExists = await User.findOne({ where: { username } });
  if (usernameExists) {
    res.status(409).json({ message: 'Benutzername bereits vergeben' });
    return;
  }

  const password_hash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  const user = await User.create({ username, email, password_hash, role: 'trainee' });

  res.status(201).json({ token: signToken(user) });
}

export async function login(req: Request, res: Response): Promise<void> {
  const { email, password } = req.body as Record<string, string>;

  if (!email || !password) {
    res.status(400).json({ message: 'email und password sind erforderlich' });
    return;
  }

  const user = await User.findOne({ where: { email } });
  if (!user) {
    res.status(401).json({ message: 'E-Mail oder Passwort falsch' });
    return;
  }

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    res.status(401).json({ message: 'E-Mail oder Passwort falsch' });
    return;
  }

  res.json({ token: signToken(user) });
}

export async function me(req: Request, res: Response): Promise<void> {
  const user = await User.findByPk(req.user!.userId, {
    attributes: ['id', 'username', 'email', 'role', 'created_at'],
  });

  if (!user) {
    res.status(404).json({ message: 'Benutzer nicht gefunden' });
    return;
  }

  res.json(user);
}
