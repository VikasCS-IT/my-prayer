import { NextRequest, NextResponse } from 'next/server';
import { serverSupabase } from '@/lib/server-supabase';

export async function GET() {
  try {
    const { data, error } = await serverSupabase
      .from('deities')
      .select('*')
      .order('display_order', { ascending: true });

    if (error) throw error;
    return NextResponse.json({ success: true, data: data || [] });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch deities' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      religion_id,
      name_en,
      name_hi,
      significance,
      display_order,
      is_popular,
      color,
      avatar_icon,
      image_url,
      associated_day_hi,
      associated_day_en,
    } = body;

    if (!name_en || !name_hi) {
      return NextResponse.json(
        { success: false, error: 'name_en and name_hi are required' },
        { status: 400 }
      );
    }

    const { data, error } = await serverSupabase
      .from('deities')
      .insert([
        {
          religion_id: religion_id || null,
          name_en,
          name_hi,
          significance: significance || '',
          display_order: Number(display_order) || 1,
          is_popular: Boolean(is_popular),
          color: color || '#FF6F00',
          avatar_icon: avatar_icon || '🕉️',
          image_url: image_url || null,
          associated_day_hi: associated_day_hi || null,
          associated_day_en: associated_day_en || null,
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create deity' },
      { status: 500 }
    );
  }
}
