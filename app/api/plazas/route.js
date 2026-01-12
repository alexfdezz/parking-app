import clientPromise from './mongodb';
import { NextResponse } from 'next/server';

// ESTA LÍNEA ES VITAL PARA QUE NO GUARDE CACHÉ VIEJO
export const dynamic = 'force-dynamic';

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
    
    // --- CAMBIO DE SEGURIDAD ---
    // Separamos el '_id' (interno de Mongo) del resto de datos.
    // Si intentamos enviar '_id' de vuelta a la base de datos, Mongo bloquea la operación.
    // Al quitarlo aquí, aseguramos que Guardar y Borrar funcionen siempre.
    const { id_plaza, _id, ...datos } = body;
    
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