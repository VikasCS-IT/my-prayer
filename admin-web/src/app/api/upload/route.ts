import { NextRequest, NextResponse } from 'next/server';
import { serverSupabase } from '@/lib/server-supabase';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const bucket = (formData.get('bucket') as string) || 'app-assets';

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 });
    }

    const safeName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { error } = await serverSupabase.storage.from(bucket).upload(safeName, buffer, {
      contentType: file.type || 'application/octet-stream',
      upsert: true,
    });

    if (error) throw error;

    const { data: publicData } = serverSupabase.storage.from(bucket).getPublicUrl(safeName);

    return NextResponse.json({
      success: true,
      data: {
        url: publicData.publicUrl,
        fileName: safeName,
        bucket,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'File upload failed' },
      { status: 500 }
    );
  }
}
