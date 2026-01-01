"use client";
import React, { useState, useEffect } from 'react';
import { Car, User, Save, Trash2, X, MapPin, ArrowDown, ArrowUp, ArrowRight, Phone } from 'lucide-react';

// --- DEFINICIÓN DE TIPOS ---
interface PlazaData {
  id_plaza: string;
  estado: string;
  nombre?: string;
  matricula?: string;
  telefono?: string;
  fecha_entrada?: string;
  _id?: string;
}

type PlazasState = Record<string, PlazaData>;

// --- CONFIGURACIÓN DE NUMERACIÓN EXACTA ---
const ZONAS = {
  A: Array.from({ length: 14 }, (_, i) => String(14 - i)),
  B: Array.from({ length: 13 }, (_, i) => String(15 + i)),
  C: Array.from({ length: 15 }, (_, i) => String(42 - i)),
  D: Array.from({ length: 15 }, (_, i) => String(43 + i)),
  E: Array.from({ length: 20 }, (_, i) => String(58 + i)),
  F: Array.from({ length: 9 },  (_, i) => String(86 - i)),
};

export default function ParkingApp() {
  const [plazas, setPlazas] = useState<PlazasState>({});
  const [loading, setLoading] = useState(true);
  const [selectedPlaza, setSelectedPlaza] = useState<string | null>(null);
  const [formData, setFormData] = useState({ nombre: '', matricula: '', telefono: '' });

  // 1. CARGAR DATOS
  useEffect(() => { fetchPlazas(); }, []);

  const fetchPlazas = async () => {
    try {
      const res = await fetch('/api/plazas');
      const data = await res.json();
      const mapaPlazas: PlazasState = {};
      if (Array.isArray(data)) {
        data.forEach((p: PlazaData) => {
          mapaPlazas[p.id_plaza] = p;
        });
      }
      setPlazas(mapaPlazas);
      setLoading(false);
    } catch (error) { 
      console.error(error);
      setLoading(false);
    }
  };

  // 2. GUARDAR DATOS
  const handleGuardar = async () => {
    if (!selectedPlaza) return;
    const nuevaData: PlazaData = { 
      id_plaza: selectedPlaza, 
      estado: 'ocupada', 
      ...formData, 
      fecha_entrada: new Date().toISOString() 
    };
    setPlazas((prev: PlazasState) => ({ ...prev, [selectedPlaza]: nuevaData }));
    setSelectedPlaza(null);
    setFormData({ nombre: '', matricula: '', telefono: '' });

    await fetch('/api/plazas', { 
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' }, 
      body: JSON.stringify(nuevaData) 
    });
  };

  // 3. LIBERAR PLAZA
  const handleLiberar = async () => {
    if (!selectedPlaza) return;
    const datosVacios: PlazaData = { 
      id_plaza: selectedPlaza, 
      estado: 'libre', 
      nombre: '', 
      matricula: '', 
      telefono: '' 
    };
    setPlazas((prev: PlazasState) => ({ ...prev, [selectedPlaza]: datosVacios }));
    setSelectedPlaza(null);
    await fetch('/api/plazas', { method: 'POST', body: JSON.stringify(datosVacios) });
  };

  // --- COMPONENTE: PASILLO ---
  const Pasillo = ({ direction }: { direction: 'up' | 'down' }) => (
    <div className="flex flex-col justify-around h-full w-24 mx-2 relative select-none shrink-0 py-8 gap-24">
      <div className="absolute left-0 top-0 bottom-0 w-px border-l-2 border-dashed border-yellow-500/20"></div>
      <div className="absolute right-0 top-0 bottom-0 w-px border-r-2 border-dashed border-yellow-500/20"></div>
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="text-slate-600 flex justify-center opacity-40">
           {direction === 'up' ? <ArrowUp size={48} strokeWidth={3} /> : <ArrowDown size={48} strokeWidth={3} />}
        </div>
      ))}
    </div>
  );

  // --- COMPONENTE: PLAZA ---
  const Plaza = ({ id, vertical = true }: { id: string, vertical?: boolean }) => {
    const data = plazas[id];
    const ocupada = data?.estado === 'ocupada';
    
    // DETECTAMOS SI ES LA PLAZA ESPECIAL 27
    const isPlaza27 = id === '27';

    // Definimos las dimensiones y orientación
    let dimensionsClass = '';
    if (isPlaza27) {
      // Plaza 27: Alta y estrecha (vertical), alineada a la derecha (self-end)
      dimensionsClass = 'h-36 w-10 mb-1 flex-col items-center justify-between self-end'; 
    } else if (vertical) {
      // Normal Columna: Bajita y ancha
      dimensionsClass = 'h-10 w-36 mb-1 flex-row items-center justify-between'; 
    } else {
      // Normal Fila F: Alta y estrecha
      dimensionsClass = 'h-36 w-10 mr-1 flex-col items-center justify-between';
    }

    return (
      <div 
        onClick={() => {
          setSelectedPlaza(id);
          if (ocupada) setFormData({ nombre: data.nombre || '', matricula: data.matricula || '', telefono: data.telefono || '' });
          else setFormData({ nombre: '', matricula: '', telefono: '' });
        }}
        className={`
          relative cursor-pointer transition-all duration-300 group border-2 rounded-sm px-2
          ${dimensionsClass} /* Aplicamos las dimensiones */
          
          ${ocupada 
            ? 'border-red-500/60 bg-red-900/20 shadow-[0_0_8px_rgba(239,68,68,0.2)]' 
            : 'border-emerald-500/50 bg-emerald-900/20 hover:bg-emerald-800/40 hover:border-emerald-400 shadow-[0_0_5px_rgba(16,185,129,0.1)]'} 
        `}
      >
        {/* NÚMERO DE PLAZA */}
        <span className={`font-black text-[12px] text-center
          ${isPlaza27 ? 'order-1' : ''} 
          ${!isPlaza27 && !vertical ? '-rotate-90' : ''} 
          ${ocupada ? 'text-slate-500 opacity-50' : 'text-emerald-400 opacity-90'}
        `}>
            {id}
        </span>

        {/* Contenido (Coche y Matricula) */}
        {ocupada ? (
          <div className={`flex items-center gap-2 
            ${isPlaza27 ? 'flex-col-reverse order-2' : ''} 
            ${!isPlaza27 && !vertical ? 'flex-col-reverse' : ''}
            ${!isPlaza27 && vertical ? 'flex-row-reverse' : ''}
          `}>
             <span className={`text-[10px] font-mono font-bold text-white bg-slate-950 px-1 border border-slate-700 rounded 
               ${!isPlaza27 && !vertical ? '[writing-mode:vertical-rl] py-1' : ''}
               ${isPlaza27 ? '[writing-mode:vertical-rl] py-1' : ''}
             `}>
               {data.matricula}
             </span>
             <Car className={`text-red-400 
               ${!isPlaza27 && !vertical ? 'rotate-90' : ''}
               ${isPlaza27 ? 'rotate-90' : ''}
             `} size={16} />
          </div>
        ) : (
          <span className={`text-[9px] text-emerald-500 font-bold opacity-60 group-hover:opacity-100 transition-opacity 
            ${!isPlaza27 && !vertical ? '[writing-mode:vertical-rl]' : ''}
            ${isPlaza27 ? '[writing-mode:vertical-rl]' : ''}
          `}>LIBRE</span>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-900 p-2 font-sans text-slate-200">
      
      {/* CABECERA */}
      <header className="bg-slate-800 border-b border-slate-700 p-4 rounded-xl mb-6 flex justify-between items-center shadow-lg sticky top-0 z-50">
        <div>
          <h1 className="text-xl font-bold text-white flex gap-2 items-center tracking-tight">
             <div className="bg-emerald-500 p-1 rounded text-slate-900"><Car size={20} strokeWidth={2.5} /></div>
             PARKING <span className="text-emerald-500">MANAGER</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1 ml-1">Control de acceso • Planta 1</p>
        </div>
        <div className="flex gap-2 text-xs font-mono bg-slate-950 border border-slate-700 px-3 py-1 rounded-full text-green-400 items-center shadow-inner">
             <div className={`w-2 h-2 rounded-full ${loading ? 'bg-yellow-500' : 'bg-green-500 animate-pulse'}`}></div>
             {loading ? 'SYNC...' : 'ONLINE'}
        </div>
      </header>

      {/* MAPA */}
      <div className="overflow-auto pb-20 cursor-grab active:cursor-grabbing">
        <div className="min-w-fit bg-[#1e293b] p-10 rounded-xl shadow-2xl mx-auto w-fit border-4 border-slate-800 relative">
          <div className="absolute top-10 left-1/2 -translate-x-1/2 text-slate-800 text-6xl font-black tracking-[1em] opacity-30 select-none pointer-events-none">P1</div>

          <div className="flex justify-center items-start relative z-10 gap-0"> 
            
            {/* ZONA A */}
            <div className="flex flex-col">
              <div className="text-center font-black text-slate-600 text-xl mb-2 tracking-widest border-b-2 border-slate-700 pb-1">A</div>
              {ZONAS.A.map(id => <Plaza key={id} id={id} />)}
            </div>

            <Pasillo direction="down" />

            {/* ZONA B y C */}
            <div className="flex gap-0 relative bg-slate-800/30 p-2 rounded border border-slate-700/50">
              <div className="absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-4 bg-slate-800 border-l border-r border-slate-600 rounded"></div>
              <div className="flex flex-col pr-4">
                 <div className="text-center font-black text-slate-600 text-xl mb-2 tracking-widest border-b-2 border-slate-700 pb-1">B</div>
                 {ZONAS.B.map(id => <Plaza key={id} id={id} />)}
              </div>
              <div className="flex flex-col pl-4">
                 <div className="text-center font-black text-slate-600 text-xl mb-2 tracking-widest border-b-2 border-slate-700 pb-1">C</div>
                 {ZONAS.C.map(id => <Plaza key={id} id={id} />)}
              </div>
            </div>

            <Pasillo direction="up" />

            {/* ZONA D */}
            <div className="flex flex-col">
              <div className="text-center font-black text-slate-600 text-xl mb-2 tracking-widest border-b-2 border-slate-700 pb-1">D</div>
              {ZONAS.D.map(id => <Plaza key={id} id={id} />)}
            </div>

            <Pasillo direction="down" />

             {/* ZONA E */}
             <div className="flex flex-col">
              <div className="text-center font-black text-slate-600 text-xl mb-2 tracking-widest border-b-2 border-slate-700 pb-1">E</div>
              {ZONAS.E.map(id => <Plaza key={id} id={id} />)}
            </div>
          </div>

          {/* ZONA F */}
          <div className="mt-8 pt-8 border-t-4 border-dashed border-yellow-500/10 flex items-end pl-2 relative">
            <div className="absolute top-4 w-full flex justify-around opacity-20 pointer-events-none pr-32">
                <ArrowRight size={40} strokeWidth={3} className="text-slate-500"/>
                <ArrowRight size={40} strokeWidth={3} className="text-slate-500"/>
                <ArrowRight size={40} strokeWidth={3} className="text-slate-500"/>
            </div>
            <div className="flex flex-col mr-20 relative z-10">
               <div className="w-36 h-32 bg-[url('https://www.transparenttextures.com/patterns/diagonal-striped-brick.png')] bg-slate-800 rounded border-2 border-yellow-500/20 flex flex-col items-center justify-center text-slate-500 text-center p-2 shadow-inner">
                  <MapPin size={24} className="mb-1 opacity-50"/>
                  <span className="text-[10px] font-black uppercase tracking-widest">ZONA<br/>MOTOS</span>
               </div>
            </div>
            <div className="flex flex-col w-full relative z-10">
               <div className="text-left font-black text-slate-600 text-xl mb-2 ml-2 tracking-widest">F</div>
               <div className="flex gap-1">
                  {ZONAS.F.map(id => <Plaza key={id} id={id} vertical={false} />)}
               </div>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL */}
      {selectedPlaza && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-[0_0_50px_rgba(0,0,0,0.5)] w-full max-w-md overflow-hidden">
            <div className="bg-slate-800 p-5 border-b border-slate-700 flex justify-between items-center">
              <h3 className="text-2xl font-black text-white tracking-tight flex items-center gap-2"><span className="text-emerald-500">PLAZA</span> {selectedPlaza}</h3>
              <button onClick={() => setSelectedPlaza(null)} className="hover:bg-slate-700 p-2 rounded-full text-slate-400 transition"><X size={24}/></button>
            </div>
            
            <div className="p-6 space-y-6">
              {plazas[selectedPlaza]?.estado === 'ocupada' ? (
                <div className="space-y-4">
                   <div className="grid grid-cols-2 gap-4">
                     <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700">
                        <label className="text-xs text-slate-500 uppercase font-black tracking-widest">Cliente</label>
                        <div className="text-md font-medium text-white mt-1 truncate">{formData.nombre || 'Desconocido'}</div>
                     </div>
                     <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700">
                        <label className="text-xs text-slate-500 uppercase font-black tracking-widest">Teléfono</label>
                        <div className="text-md font-medium text-white mt-1 truncate">{formData.telefono || '---'}</div>
                     </div>
                   </div>
                   <div className="flex items-center gap-4 bg-slate-950 p-4 rounded-lg border border-slate-800 relative overflow-hidden">
                      <div className="absolute right-[-20px] top-[-20px] text-slate-800 opacity-20 rotate-12"><Car size={100} /></div>
                      <Car className="text-yellow-500 relative z-10" size={32} />
                      <div className="relative z-10">
                        <label className="text-xs text-slate-500 uppercase font-black tracking-widest">Matrícula</label>
                        <div className="text-3xl font-mono font-bold text-white tracking-widest">{formData.matricula}</div>
                      </div>
                   </div>
                   <div className="pt-4 flex gap-3">
                     <button onClick={handleLiberar} className="flex-1 bg-red-600 text-white py-3 rounded-lg font-bold hover:bg-red-500 transition flex justify-center gap-2 items-center"><Trash2 size={18} /> SALIDA</button>
                     <button onClick={() => setPlazas(prev => ({...prev, [selectedPlaza]: {...prev[selectedPlaza], estado: 'libre'} }))} className="flex-1 bg-slate-800 text-slate-300 border border-slate-700 py-3 rounded-lg font-bold hover:bg-slate-700 transition">EDITAR</button>
                   </div>
                </div>
              ) : (
                <div className="space-y-5">
                  <div className="space-y-2">
                    <label className="text-xs text-slate-400 uppercase font-bold tracking-wider ml-1">Nombre del Cliente</label>
                    <div className="relative group">
                      <User className="absolute left-3 top-3.5 text-slate-500 group-focus-within:text-emerald-500 transition" size={20} />
                      <input className="w-full pl-10 p-4 bg-slate-950 border border-slate-700 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none transition text-white" placeholder="Nombre completo" value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value})} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs text-slate-400 uppercase font-bold tracking-wider ml-1">Teléfono</label>
                    <div className="relative group">
                      <Phone className="absolute left-3 top-3.5 text-slate-500 group-focus-within:text-emerald-500 transition" size={20} />
                      <input className="w-full pl-10 p-4 bg-slate-950 border border-slate-700 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none transition text-white" placeholder="Ej. 600 123 456" type="tel" value={formData.telefono} onChange={e => setFormData({...formData, telefono: e.target.value})} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs text-slate-400 uppercase font-bold tracking-wider ml-1">Matrícula</label>
                    <div className="relative group">
                      <Car className="absolute left-3 top-3.5 text-slate-500 group-focus-within:text-emerald-500 transition" size={20} />
                      <input className="w-full pl-10 p-4 bg-slate-950 border border-slate-700 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none transition font-mono uppercase text-white text-xl tracking-wider" placeholder="0000 XXX" value={formData.matricula} onChange={e => setFormData({...formData, matricula: e.target.value.toUpperCase()})} />
                    </div>
                  </div>
                  <button onClick={handleGuardar} disabled={!formData.matricula} className="w-full bg-emerald-500 text-slate-900 py-4 rounded-lg font-black tracking-wide hover:bg-emerald-400 transition flex justify-center gap-2 items-center disabled:opacity-50 mt-6"><Save size={20} /> ENTRADA</button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}