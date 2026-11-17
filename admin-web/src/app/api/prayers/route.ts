import { NextRequest, NextResponse } from 'next/server';
import { serverSupabase } from '@/lib/server-supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const deityId = searchParams.get('deity_id');

    let query = serverSupabase
      .from('prayers')
      .select('*, verses(id)')
      .order('created_at', { ascending: false });

    if (category && category !== 'all') {
      query = query.eq('category', category);
    }
    if (deityId && deityId !== 'all') {
      query = query.eq('deity_id', deityId);
    }

    const { data, error } = await query;
    if (error) throw error;

    const formatted = (data || []).map((p: any) => ({
      ...p,
      verses_count: p.verses?.length || 0,
    }));

    return NextResponse.json({ success: true, data: formatted });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch prayers' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prayer, verses } = body;

    if (!prayer?.title_en || !prayer?.title_hi || !prayer?.deity_id) {
      return NextResponse.json(
        { success: false, error: 'title_en, title_hi, and deity_id are required' },
        { status: 400 }
      );
    }

    const { data: pData, error: pError } = await serverSupabase
      .from('prayers')
      .insert([prayer])
      .select()
      .single();

    if (pError) throw pError;

    if (verses && Array.isArray(verses) && verses.length > 0) {
      const formattedVerses = verses.map((v: any, idx: number) => ({
        prayer_id: pData.id,
        verse_number: idx + 1,
        text_hi: v.text_hi,
        text_en: v.text_en || null,
        meaning_en: v.meaning_en || null,
        verse_type: v.verse_type || 'chaupai',
      }));

      const { error: vError } = await serverSupabase.from('verses').insert(formattedVerses);
      if (vError) throw vError;
    }

    return NextResponse.json({ success: true, data: pData }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create prayer' },
      { status: 500 }
    );
  }
}
