import { NextRequest, NextResponse } from 'next/server';
import { RegisterUserSchema } from '@/core/application/validators/AuthValidator';
import { UserApplicationService } from '@/core/application/services/UserApplicationService';
import { PrismaUserRepository } from '@/core/infrastructure/repositories/PrismaUserRepository';
import { hashPassword } from '@/lib/password';
import { DuplicateEntityException } from '@/core/domain/exceptions';
import type { ZodIssue } from 'zod';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate request body
    const validationResult = RegisterUserSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          message: 'Validation failed',
          errors: validationResult.error.issues.map(
            (issue: ZodIssue) => ({
              field: issue.path.join('.'),
              message: issue.message,
            })
          ),
        },
        { status: 400 }
      );
    }

    const { name, email, password } = validationResult.data;

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user using application service
    const userRepository = new PrismaUserRepository();
    const userService = new UserApplicationService(userRepository);

    // Check if user already exists
    const existingUser = await userService.getUserByEmail(email);
    if (existingUser.isSuccess()) {
      return NextResponse.json(
        { message: 'Email already exists' },
        { status: 409 }
      );
    }

    // Create the user
    const result = await userService.createUser({
      name,
      email,
      password: hashedPassword,
    });

    if (result.isFailure()) {
      if (result.error instanceof DuplicateEntityException) {
        return NextResponse.json(
          { message: 'Email already exists' },
          { status: 409 }
        );
      }
      throw result.error;
    }

    return NextResponse.json(
      { message: 'User created successfully' },
      { status: 201 }
    );
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { message: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}