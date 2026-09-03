import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();

    if (cleanEmail === 'support@shopease.com' && password === 'support123') {
      return NextResponse.json({
        success: true,
        user: {
          name: 'Customer Support Agent',
          email: 'support@shopease.com',
          role: 'Level 1 Support',
          level: 1,
          badgeColor: 'indigo'
        }
      });
    } else if (cleanEmail === 'escalations@shopease.com' && password === 'escalate123') {
      return NextResponse.json({
        success: true,
        user: {
          name: 'Senior Escalations Officer',
          email: 'escalations@shopease.com',
          role: 'Level 2 Escalations',
          level: 2,
          badgeColor: 'purple'
        }
      });
    } else if (cleanEmail === 'security@shopease.com' && password === 'security123') {
      return NextResponse.json({
        success: true,
        user: {
          name: 'Security & Fraud Specialist',
          email: 'security@shopease.com',
          role: 'Level 3 Security Desk',
          level: 3,
          badgeColor: 'rose'
        }
      });
    } else if (
      (cleanEmail === 'grievance.officer@shopease.in' || cleanEmail === 'legalnotices@shopease.in') &&
      (password === 'legal123' || password === 'grievance123')
    ) {
      return NextResponse.json({
        success: true,
        user: {
          name: 'Mr. Rohan Sharma',
          email: cleanEmail,
          role: 'Chief Grievance Officer (CGO)',
          level: 4,
          badgeColor: 'amber'
        }
      });
    }

    return NextResponse.json({ error: 'Invalid credentials or unauthorized grievance account' }, { status: 401 });
  } catch (err: any) {
    console.error('Error logging in grievance officer:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
