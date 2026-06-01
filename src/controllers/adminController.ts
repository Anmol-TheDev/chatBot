import type { Request, Response, NextFunction, RequestHandler } from "express";
import jwt, { type SignOptions } from "jsonwebtoken";
import { catchAsync } from "../utils/catchAsync.js";

interface LoginRequest extends Request {
  body: {
    email: string;
    password: string;
  };
}

export const adminLogin: RequestHandler = catchAsync(
  async (req: LoginRequest, res: Response, next: NextFunction) => {
    const { email, password } = req.body;

    if (!email || !password) {
      const error = new Error("Email and password are required") as any;
      error.statusCode = 400;
      return next(error);
    }

    // Check admin credentials from environment variables
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;
    const jwtSecret = process.env.JWT_SECRET;

    if (!adminEmail || !adminPassword || !jwtSecret) {
      const error = new Error("Server configuration error") as any;
      error.statusCode = 500;
      return next(error);
    }

    // Verify credentials
    if (email !== adminEmail || password !== adminPassword) {
      const error = new Error("Invalid email or password") as any;
      error.statusCode = 401;
      return next(error);
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        email: adminEmail,
        role: "admin",
        iat: Math.floor(Date.now() / 1000),
      },
      jwtSecret,
      {
        expiresIn: process.env.JWT_EXPIRES_IN as SignOptions["expiresIn"],
      },
    );

    res.status(200).json({
      status: "success",
      message: "Login successful",
      token,
    });
  },
);
