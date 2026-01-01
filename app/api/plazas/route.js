import clientPromise from '../../../lib/mongodb';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db("gestion_parking");
    const plazas = await db.collection("plazas").find({}).toArray();
    return NextResponse.json(plazas);
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const client = await clientPromise;
    const db = client.db("gestion_parking");
    const body = await request.json();
    
    const { id_plaza, ...datos } = body;
    
    await db.collection("plazas").updateOne(
      { id_plaza: id_plaza },
      { $set: { id_plaza, ...datos } },
      { upsert: true }
    );

    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}