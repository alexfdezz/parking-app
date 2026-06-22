// Importamos desde './mongodb' porque están en la misma carpeta
import clientPromise from './mongodb';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db("gestion_parking");
    const plazas = await db.collection("plazas").find({}).toArray();
    return NextResponse.json(plazas);
  } catch (e: any) { // El : any es vital aquí
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const client = await clientPromise;
    const db = client.db("gestion_parking");
    const body = await request.json();
    
    const { id_plaza: raw_id, _id, ...datos } = body;
    const id_plaza = String(raw_id);

    // Eliminar posibles duplicados y reemplazar con el documento completo
    await db.collection("plazas").deleteMany({ id_plaza: id_plaza });
    await db.collection("plazas").insertOne({ id_plaza, ...datos });

    return NextResponse.json({ success: true });
  } catch (e: any) { // El : any es vital aquí también
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}