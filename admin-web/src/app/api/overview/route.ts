import { NextResponse } from 'next/server';
import { serverSupabase } from '@/lib/server-supabase';

export async function GET() {
  try {
    const [religionsRes, deitiesRes, prayersRes, profilesRes] = await Promise.all([
      serverSupabase.from('religions').select('id', { count: 'exact', head: true }),
      serverSupabase.from('deities').select('id', { count: 'exact', head: true }),
      serverSupabase.from('prayers').select('id', { count: 'exact', head: true }),
      serverSupabase.from('profiles').select('id', { count: 'exact', head: true }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        religionsCount: religionsRes.count ?? 0,
        deitiesCount: deitiesRes.count ?? 0,
        prayersCount: prayersRes.count ?? 0,
        usersCount: profilesRes.count ?? 0,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch overview metrics' },
      { status: 500 }
    );
  }
}
