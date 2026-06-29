import { NextResponse } from 'next/server';
import { supabase } from '../../../lib/supabase';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.SUPABASE_SECRET_KEY || 'shopease-jwt-fallback-secret';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

 
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required.' },
        { status: 400 }
      );
    }

    const isConnectionError = (err: any) => {
      if (!err) return false;
      const msg = (err.message || '').toLowerCase();
      return msg.includes('fetch failed') || msg.includes('enotfound') || msg.includes('network') || msg.includes('connect');
    };

    // 2. Fetch user from Supabase database
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .maybeSingle();

    if (error) {
      console.error('Supabase query error (login):', error);
      if (isConnectionError(error)) {
        return NextResponse.json(
          { error: 'Failed to connect to the database. Please verify your internet connection and check if SUPABASE_URL in .env.local is correct.' },
          { status: 503 }
        );
      }
      return NextResponse.json(
        { error: 'Database query error during login. Please check if table "users" is created.' },
        { status: 550 }
      );
    }

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid email or password.' },
        { status: 401 }
      );
    }

    // 3. Compare password with hashed password
    const isPasswordMatch = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordMatch) {
      return NextResponse.json(
        { error: 'Invalid email or password.' },
        { status: 401 }
      );
    }

    // 4. Generate JWT Token
    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        email: user.email,
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // 5. Return token and user details
    return NextResponse.json(
      {
        message: 'Login successful!',
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
        },
      },
      { status: 200 }
    );
  } catch (err: any) {
    console.error('Login handler crash:', err);
    return NextResponse.json(
      { error: 'Internal server error.' },
      { status: 500 }
    );
  }
}
