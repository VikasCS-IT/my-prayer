import { NextRequest, NextResponse } from 'next/server';
import { serverSupabase } from '@/lib/server-supabase';

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const [prayerRes, versesRes] = await Promise.all([
      serverSupabase.from('prayers').select('*').eq('id', id).single(),
      serverSupabase.from('verses').select('*').eq('prayer_id', id).order('verse_number', { ascending: true }),
    ]);

    if (prayerRes.error) throw prayerRes.error;

    return NextResponse.json({
      success: true,
      data: {
        prayer: prayerRes.data,
        verses: versesRes.data || [],
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch prayer' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();

    const { data, error } = await serverSupabase
      .from('prayers')
      .update(body)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update prayer' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Delete associated verses first
    await serverSupabase.from('verses').delete().eq('prayer_id', id);
    const { error } = await serverSupabase.from('prayers').delete().eq('id', id);

    if (error) throw error;
    return NextResponse.json({ success: true, message: 'Prayer deleted successfully' });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete prayer' },
      { status: 500 }
    );
  }
}
