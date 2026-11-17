import { NextRequest, NextResponse } from 'next/server';
import { serverSupabase } from '@/lib/server-supabase';

export async function GET() {
  try {
    const { data, error } = await serverSupabase
      .from('religions')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) throw error;
    return NextResponse.json({ success: true, data: data || [] });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch religions' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name_en, name_hi, slug, icon_url, is_active } = body;

    if (!name_en || !name_hi || !slug) {
      return NextResponse.json(
        { success: false, error: 'name_en, name_hi, and slug are required' },
        { status: 400 }
      );
    }

    const { data, error } = await serverSupabase
      .from('religions')
      .insert([
        {
          name_en,
          name_hi,
          slug: slug.toLowerCase().trim(),
          icon_url: icon_url || null,
          is_active: is_active ?? true,
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create religion' },
      { status: 500 }
    );
  }
}
