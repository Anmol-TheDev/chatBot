import jwt, { type SignOptions } from 'jsonwebtoken';
import { authConfig } from '../config/env.js';

export interface TokenPayload {
  email: string;
  role: string;
  iat?: number;
}

export const generateToken = (payload: TokenPayload): string => {
  const options: SignOptions = { 
    expiresIn: authConfig.JWT_EXPIRES_IN as SignOptions["expiresIn"]
  };

  return jwt.sign(payload, authConfig.JWT_SECRET, options);
};

export const verifyToken = (token: string): TokenPayload => {
  return jwt.verify(token, authConfig.JWT_SECRET) as TokenPayload;
};