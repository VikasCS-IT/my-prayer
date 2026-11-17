import { NextRequest, NextResponse } from 'next/server';
import { serverSupabase } from '@/lib/server-supabase';

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const { data, error } = await serverSupabase
      .from('verses')
      .select('*')
      .eq('prayer_id', id)
      .order('verse_number', { ascending: true });

    if (error) throw error;
    return NextResponse.json({ success: true, data: data || [] });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch verses' },
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
    const { verses } = body;

    // Delete existing verses for this prayer
    await serverSupabase.from('verses').delete().eq('prayer_id', id);

    if (verses && Array.isArray(verses) && verses.length > 0) {
      const formatted = verses.map((v: any, idx: number) => ({
        prayer_id: id,
        verse_number: idx + 1,
        text_hi: v.text_hi,
        text_en: v.text_en || null,
        meaning_en: v.meaning_en || null,
        verse_type: v.verse_type || 'chaupai',
      }));

      const { data, error } = await serverSupabase.from('verses').insert(formatted).select();
      if (error) throw error;
      return NextResponse.json({ success: true, data });
    }

    return NextResponse.json({ success: true, data: [] });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to save verses' },
      { status: 500 }
    );
  }
}
