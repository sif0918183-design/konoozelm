import { NextResponse } from 'next/server';
import { checkAuth } from '@/lib/admin-auth';
import { supabaseAdmin, supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
  if (!checkAuth()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const client = supabaseAdmin || supabase;
  if (!client) {
    return NextResponse.json({
      donations: [],
      stats: { totalCount: 0, pendingCount: 0, verifiedCount: 0, totalAmountVerified: 0 }
    });
  }

  try {
    const { data: donations, error } = await client
      .from('donations')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching donations list:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const items = donations || [];
    const totalCount = items.length;
    const pendingCount = items.filter(d => d.status === 'pending' || d.status === 'processing').length;
    const verifiedCount = items.filter(d => d.status === 'verified' || d.status === 'paid').length;
    const totalAmountVerified = items
      .filter(d => d.status === 'verified' || d.status === 'paid')
      .reduce((acc, d) => acc + (parseFloat(d.amount) || 0), 0);

    return NextResponse.json({
      donations: items,
      stats: {
        totalCount,
        pendingCount,
        verifiedCount,
        totalAmountVerified
      }
    });
  } catch (err: any) {
    console.error('Error in GET /api/admin/donations:', err);
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  if (!checkAuth()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const client = supabaseAdmin || supabase;
  if (!client) {
    return NextResponse.json({ error: 'Database client not available' }, { status: 500 });
  }

  try {
    const { id, status } = await req.json();

    if (!id || !['verified', 'rejected', 'pending', 'paid', 'failed', 'cancelled'].includes(status)) {
      return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 });
    }

    const { data, error } = await client
      .from('donations')
      .update({ status })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating donation status:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    console.error('Error in PATCH /api/admin/donations:', err);
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
