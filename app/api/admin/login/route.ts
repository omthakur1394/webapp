import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { password } = body;

    if (!password) {
      return NextResponse.json({ error: 'Password is required' }, { status: 400 });
    }

    if (password === 'admin@1') {
      return NextResponse.json({
        success: true,
        region: 'Mumbai',
        token: 'admin-mumbai-session-token'
      });
    } else if (password === 'admain@2' || password === 'admin@2') {
      return NextResponse.json({
        success: true,
        region: 'Nagpur',
        token: 'admin-nagpur-session-token'
      });
    }

    return NextResponse.json({ error: 'Invalid admin credentials' }, { status: 401 });
  } catch (err: any) {
    console.error('Error logging in admin:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
