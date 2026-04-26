import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { config } from '../config/env.js';

export interface TokenPayload {
  id: string;
  username: string;
  role: string;
}

export const generateToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, config.jwt.secret, { expiresIn: config.jwt.expiresIn });
};

export const verifyToken = (token: string): TokenPayload => {
  return jwt.verify(token, config.jwt.secret) as TokenPayload;
};

export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, 12);
};

export const verifyPassword = async (password: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};

export const generateSecureId = (): string => {
  return `gaka_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
};