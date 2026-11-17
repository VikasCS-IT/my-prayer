import { NextRequest, NextResponse } from 'next/server';
import { serverSupabase } from '@/lib/server-supabase';
import { DbAppConfig } from '@/types';

export async function GET() {
  try {
    const { data, error } = await serverSupabase.from('app_config').select('*');
    if (error) throw error;

    const configMap: Record<string, string> = {};
    ((data as DbAppConfig[]) || []).forEach((c) => {
      configMap[c.config_key] = c.config_value;
    });

    return NextResponse.json({ success: true, data: configMap });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch config' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const entries = Object.entries(body as Record<string, string>);

    for (const [key, value] of entries) {
      const { error } = await serverSupabase.from('app_config').upsert(
        {
          config_key: key,
          config_value: String(value),
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'config_key' }
      );
      if (error) throw error;
    }

    return NextResponse.json({ success: true, message: 'Config updated successfully' });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update config' },
      { status: 500 }
    );
  }
}
