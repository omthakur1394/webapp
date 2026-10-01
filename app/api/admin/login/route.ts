import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { password } = body;

    if (!password) {
      return NextResponse.json({ error: 'Password is required' }, { status: 400 });
    }

    const pwd = password.trim().toLowerCase();

    if (pwd === 'admin' || pwd === 'admin123' || pwd === 'admin@123' || pwd === 'super' || pwd === 'superadmin') {
      return NextResponse.json({
        success: true,
        region: 'Super',
        token: 'admin-super-session-token'
      });
    } else if (pwd === 'admin@1' || pwd === 'mumbai123' || pwd === 'mumbai') {
      return NextResponse.json({
        success: true,
        region: 'Mumbai',
        token: 'admin-mumbai-session-token'
      });
    } else if (pwd === 'admain@2' || pwd === 'admin@2' || pwd === 'nagpur123' || pwd === 'nagpur') {
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
