import jwt from 'jsonwebtoken';

export interface TokenPayload {
  email: string;
  role: string;
  iat?: number;
}

export const generateToken = (payload: TokenPayload): string => {
  const jwtSecret = process.env.JWT_SECRET;
  
  if (!jwtSecret) {
    throw new Error('JWT_SECRET is not defined in environment variables');
  }

  return jwt.sign(
    payload,
    jwtSecret,
    { 
      expiresIn: process.env.JWT_EXPIRES_IN || '7d'
    }
  );
};

export const verifyToken = (token: string): TokenPayload => {
  const jwtSecret = process.env.JWT_SECRET;
  
  if (!jwtSecret) {
    throw new Error('JWT_SECRET is not defined in environment variables');
  }

  return jwt.verify(token, jwtSecret) as TokenPayload;
};