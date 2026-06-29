import { NextResponse } from 'next/server';
import { supabase } from '../../../lib/supabase';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  try {
    const { username, email, password } = await request.json();

    // 1. Basic validation
    if (!username || !email || !password) {
      return NextResponse.json(
        { error: 'Username, email, and password are required.' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long.' },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format.' },
        { status: 400 }
      );
    }

    // 2. Check for duplicate email/username
    const isConnectionError = (err: any) => {
      if (!err) return false;
      const msg = (err.message || '').toLowerCase();
      return msg.includes('fetch failed') || msg.includes('enotfound') || msg.includes('network') || msg.includes('connect');
    };

    // Querying email
    const { data: existingUserEmail, error: emailCheckError } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (emailCheckError && emailCheckError.code !== 'PGRST116') {
      console.error('Supabase query error (email):', emailCheckError);
      if (isConnectionError(emailCheckError)) {
        return NextResponse.json(
          { error: 'Failed to connect to the database. Please verify your internet connection and check if SUPABASE_URL in .env.local is correct.' },
          { status: 503 }
        );
      }
      return NextResponse.json(
        { error: 'Failed to verify existing user email. Please check if table "users" is created.' },
        { status: 500 }
      );
    }

    if (existingUserEmail) {
      return NextResponse.json(
        { error: 'Email ID already registered.' },
        { status: 400 }
      );
    }

    // Querying username
    const { data: existingUsername, error: usernameCheckError } = await supabase
      .from('users')
      .select('id')
      .eq('username', username)
      .maybeSingle();

    if (usernameCheckError && usernameCheckError.code !== 'PGRST116') {
      console.error('Supabase query error (username):', usernameCheckError);
      if (isConnectionError(usernameCheckError)) {
        return NextResponse.json(
          { error: 'Failed to connect to the database. Please verify your internet connection.' },
          { status: 503 }
        );
      }
      return NextResponse.json(
        { error: 'Failed to verify existing username.' },
        { status: 500 }
      );
    }

    if (existingUsername) {
      return NextResponse.json(
        { error: 'Username already taken.' },
        { status: 400 }
      );
    }

    // 3. Hash the password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // 4. Insert user into the users table
    const { error: insertError } = await supabase
      .from('users')
      .insert([
        {
          username,
          email,
          password_hash: passwordHash,
        },
      ]);

    if (insertError) {
      console.error('Supabase insertion error:', insertError);
      return NextResponse.json(
        { error: `Database error during registration: ${insertError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: 'User registered successfully!' },
      { status: 201 }
    );
  } catch (err: any) {
    console.error('Registration handler crash:', err);
    return NextResponse.json(
      { error: 'Internal server error.' },
      { status: 500 }
    );
  }
}
