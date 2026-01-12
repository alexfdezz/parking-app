"use client";
import React, { useState, useEffect } from 'react';
import { Car, User, Save, Trash2, X, Phone, AlertTriangle, ArrowUp, ArrowDown, MapPin, ArrowRight } from 'lucide-react';

// --- TIPOS ---
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

// --- CONFIGURACIÓN DE NUMERACIÓN (RECUPERADA LA ORIGINAL) ---
const ZONAS = {
  // A: Del 14 al 1 (Bajando)
  A: Array.from({ length: 14 }, (_, i) => `A-${String(14 - i).padStart(2, '0')}`),
  // B: Del 15 al 27 (Subiendo)
  B: Array.from({ length: 13 }, (_, i) => `B-${String(15 + i).padStart(2, '0')}`),
  // C: Del 42 al 28 (Bajando)
  C: Array.from({ length: 15 }, (_, i) => `C-${String(42 - i).padStart(2, '0')}`),
  // D: Del 43 al 57 (Subiendo)
  D: Array.from({ length: 15 }, (_, i) => `D-${String(43 + i).padStart(2, '0')}`),
  // E: Del 58 al 77 (Subiendo)
  E: Array.from({ length: 20 }, (_, i) => `E-${String(58 + i).padStart(2, '0')}`),
  // F: Del 86 al 78 (Bajando/Izquierda)
  F: Array.from({ length: 9 },  (_, i) => `F-${String(86 - i).padStart(2, '0')}`),
  // ZONA M (MOTOS): M-01 a M-06
  M: Array.from({ length: 6 }, (_, i) => `M-${String(i + 1).padStart(2, '0')}`),
};

export default function ParkingApp() {
  const [plazas, setPlazas] = useState<PlazasState>({});
  const [loading, setLoading] = useState(true);
  const [selectedPlaza, setSelectedPlaza] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [formData, setFormData] = useState({ nombre: '', matricula: '', telefono: '' });

  // 1. CARGAR DATOS (SIN CACHÉ)
  useEffect(() => {
    fetch('/api/plazas', { cache: 'no-store' })
      .then(res => res.json())
      .then((data: any) => {
        const mapa: PlazasState = {};
        if(Array.isArray(data)) {
            data.forEach((p: PlazaData) => {
                mapa[p.id_plaza] = p;
            });
        }
        setPlazas(mapa);
        setLoading(false);
      })
      .catch((err) => console.error("Error cargando:", err));
  }, []);

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
  const confirmarLiberacion = async () => {
    if (!selectedPlaza) return;

    const datosVacios: PlazaData = {
      id_plaza: selectedPlaza,
      estado: 'libre',
      nombre: '', matricula: '', telefono: ''
    };

    setPlazas((prev: PlazasState) => ({ ...prev, [selectedPlaza]: datosVacios }));
    setSelectedPlaza(null);
    setFormData({ nombre: '', matricula: '', telefono: '' });
    setShowDeleteConfirm(false);

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
    
    // Detectamos la plaza 27
    const isPlaza27 = id.includes('27'); 
    const isMoto = id.startsWith('M-'); 

    let dimensionsClass = '';
    
    if (isMoto) {
        dimensionsClass = 'h-14 w-16 mb-1 flex-col justify-center items-center';
    } else if (isPlaza27 && !vertical) {
        // La 27 horizontal y pegada a la derecha
        dimensionsClass = 'h-36 w-10 mb-1 flex-col items-center justify-between self-end'; 
    } else if (vertical) {
        dimensionsClass = 'h-10 w-36 mb-1 flex-row items-center justify-between'; 
    } else {
        dimensionsClass = 'h-36 w-10 mr-1 flex-col items-center justify-between';
    }

    return (
      <div 
        onClick={() => {
          setSelectedPlaza(id);
          setShowDeleteConfirm(false); 
          if (ocupada && data) setFormData({ nombre: data.nombre || '', matricula: data.matricula || '', telefono: data.telefono || '' });
          else setFormData({ nombre: '', matricula: '', telefono: '' });
        }}
        className={`
          relative cursor-pointer transition-all duration-300 group border-2 rounded-sm px-2
          ${dimensionsClass}
          ${ocupada 
            ? 'border-red-500/60 bg-red-900/20 shadow-[0_0_8px_rgba(239,68,68,0.2)]' 
            : 'border-emerald-500/50 bg-emerald-900/20 hover:bg-emerald-800/40 hover:border-emerald-400 shadow-[0_0_5px_rgba(16,185,129,0.1)]'} 
        `}
      >
        <span className={`font-black text-center ${isMoto ? 'text-[10px]' : 'text-[12px]'}
          ${isPlaza27 ? 'order-1' : ''} 
          ${!isPlaza27 && !isMoto && !vertical ? '-rotate-90' : ''} 
          ${ocupada ? 'text-slate-500 opacity-50' : 'text-emerald-400 opacity-90'}
        `}>
            {id}
        </span>

        {ocupada && data ? (
          <div className={`flex items-center gap-2 
            ${isMoto ? 'flex-col-reverse' : ''}
            ${isPlaza27 ? 'flex-col-reverse order-2' : ''} 
            ${!isPlaza27 && !isMoto && !vertical ? 'flex-col-reverse' : ''}
            ${!isPlaza27 && !isMoto && vertical ? 'flex-row-reverse' : ''}
          `}>
             <span className={`font-mono font-bold text-white bg-slate-950 px-1 border border-slate-700 rounded 
               ${isMoto ? 'text-[8px] py-0.5' : 'text-[10px]'}
               ${!isPlaza27 && !isMoto && !vertical ? '[writing-mode:vertical-rl] py-1' : ''}
               ${isPlaza27 ? '[writing-mode:vertical-rl] py-1' : ''}
             `}>
               {data.matricula}
             </span>
             <Car className={`text-red-400 
               ${isMoto ? '' : (!isPlaza27 && !vertical ? 'rotate-90' : '')}
               ${isPlaza27 ? 'rotate-90' : ''}
             `} size={isMoto ? 14 : 16} />
          </div>
        ) : (
          <span className={`text-emerald-500 font-bold opacity-60 group-hover:opacity-100 transition-opacity 
            ${isMoto ? 'text-[8px]' : 'text-[9px]'}
            ${!isPlaza27 && !isMoto && !vertical ? '[writing-mode:vertical-rl]' : ''}
            ${isPlaza27 ? '[writing-mode:vertical-rl]' : ''}
          `}>LIBRE</span>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-900 p-2 font-sans text-slate-200">
      
      <header className="bg-slate-800 border-b border-slate-700 p-4 rounded-xl mb-6 flex justify-between items-center shadow-lg sticky top-0 z-50">
        <div>
          <h1 className="text-xl font-bold text-white flex gap-2 items-center tracking-tight">
             <div className="bg-emerald-500 p-1 rounded text-slate-900"><Car size={20} strokeWidth={2.5} /></div>
             PARKING <span className="text-emerald-500">GENERAL</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1 ml-1">Control de acceso</p>
        </div>
        <div className="flex gap-2 text-xs font-mono bg-slate-950 border border-slate-700 px-3 py-1 rounded-full text-green-400 items-center shadow-inner">
             <div className={`w-2 h-2 rounded-full ${loading ? 'bg-yellow-500' : 'bg-green-500 animate-pulse'}`}></div>
             {loading ? 'SYNC...' : 'ONLINE'}
        </div>
      </header>

      <div className="overflow-auto pb-20 cursor-grab active:cursor-grabbing">
        <div className="min-w-fit bg-[#1e293b] p-10 rounded-xl shadow-2xl mx-auto w-fit border-4 border-slate-800 relative">
          
          <div className="absolute top-10 left-1/2 -translate-x-1/2 text-slate-800 text-6xl font-black tracking-[1em] opacity-30 select-none pointer-events-none">P1</div>

          <div className="flex justify-center items-start relative z-10 gap-0"> 
            {/* ZONA A */}
            <div className="flex flex-col">
              <div className="text-center font-black text-slate-600 text-xl mb-2 tracking-widest border-b-2 border-slate-700 pb-1">A</div>
              {ZONAS.A.map((id: string) => <Plaza key={id} id={id} />)}
            </div>
            <Pasillo direction="down" />
            
            {/* ISLA CENTRAL (B y C) */}
            <div className="flex gap-0 relative bg-slate-800/30 p-2 rounded border border-slate-700/50">
              <div className="absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-4 bg-slate-800 border-l border-r border-slate-600 rounded"></div>
              <div className="flex flex-col pr-4">
                 <div className="text-center font-black text-slate-600 text-xl mb-2 tracking-widest border-b-2 border-slate-700 pb-1">B</div>
                 {ZONAS.B.map((id: string) => <Plaza key={id} id={id} />)}
              </div>
              <div className="flex flex-col pl-4">
                 <div className="text-center font-black text-slate-600 text-xl mb-2 tracking-widest border-b-2 border-slate-700 pb-1">C</div>
                 {ZONAS.C.map((id: string) => <Plaza key={id} id={id} />)}
              </div>
            </div>
            <Pasillo direction="up" />

            {/* ZONA D */}
            <div className="flex flex-col">
              <div className="text-center font-black text-slate-600 text-xl mb-2 tracking-widest border-b-2 border-slate-700 pb-1">D</div>
              {ZONAS.D.map((id: string) => <Plaza key={id} id={id} />)}
            </div>
            <Pasillo direction="down" />

             <div className="flex flex-col">
              <div className="text-center font-black text-slate-600 text-xl mb-2 tracking-widest border-b-2 border-slate-700 pb-1">E</div>
              {ZONAS.E.map((id: string) => <Plaza key={id} id={id} />)}
            </div>
          </div>

          {/* CALLE INFERIOR */}
          <div className="mt-8 pt-8 border-t-4 border-dashed border-yellow-500/10 flex items-end pl-2 relative">
            
            {/* ZONA MOTOS */}
            <div className="flex flex-col mr-20 relative z-10 gap-2">
               <div className="text-center font-black text-slate-600 text-xs tracking-widest">MOTOS</div>
               {/* Grid de 2 columnas */}
               <div className="grid grid-cols-2 gap-1 bg-slate-800/50 p-2 rounded border-2 border-dashed border-yellow-500/20">
                  {ZONAS.M.map((id: string) => <Plaza key={id} id={id} />)}
               </div>
            </div>

            <div className="flex flex-col w-full relative z-10">
               <div className="text-left font-black text-slate-600 text-xl mb-2 ml-2 tracking-widest">F</div>
               <div className="flex gap-1">
                  {ZONAS.F.map((id: string) => <Plaza key={id} id={id} vertical={false} />)}
               </div>
               
               {/* FLECHAS DECORATIVAS ABAJO */}
               <div className="flex justify-around mt-4 opacity-20 w-full pr-32">
                   <ArrowRight size={40} strokeWidth={3} className="text-slate-500"/>
                   <ArrowRight size={40} strokeWidth={3} className="text-slate-500"/>
                   <ArrowRight size={40} strokeWidth={3} className="text-slate-500"/>
               </div>
            </div>
          </div>
        </div>
      </div>

      {/* --- MODAL (CON SEGURIDAD Y TELÉFONO) --- */}
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
                     {showDeleteConfirm ? (
                        <div className="w-full bg-red-900/20 border border-red-500/50 p-4 rounded-lg flex flex-col gap-3 animate-in fade-in zoom-in-95">
                          <div className="flex items-center gap-2 text-red-400 font-bold justify-center text-sm">
                              <AlertTriangle size={18}/>
                              <span>¿Estás seguro?</span>
                          </div>
                          <div className="flex gap-2">
                              <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 py-2 bg-slate-800 text-white rounded font-bold hover:bg-slate-700 text-sm">Cancelar</button>
                              <button onClick={confirmarLiberacion} className="flex-1 py-2 bg-red-600 text-white rounded font-bold hover:bg-red-700 text-sm">Sí, Eliminar</button>
                          </div>
                        </div>
                     ) : (
                        <>
                           <button onClick={() => setShowDeleteConfirm(true)} className="flex-1 bg-red-600 text-white py-3 rounded-lg font-bold hover:bg-red-500 transition flex justify-center gap-2 items-center"><Trash2 size={18} /> BORRAR</button>
                           <button onClick={handleGuardar} className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-500 transition flex justify-center gap-2 items-center"><Save size={18} /> GUARDAR</button>
                        </>
                     )}
                   </div>
                </div>
              ) : (
                <div className="space-y-5">
                  <div className="space-y-2">
                    <label className="text-xs text-slate-400 uppercase font-bold tracking-wider ml-1">Nombre</label>
                    <div className="relative group">
                      <User className="absolute left-3 top-3.5 text-slate-500 transition" size={20} />
                      <input className="w-full pl-10 p-4 bg-slate-950 border border-slate-700 rounded-lg text-white" placeholder="Nombre completo" value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value})} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs text-slate-400 uppercase font-bold tracking-wider ml-1">Teléfono</label>
                    <div className="relative group">
                      <Phone className="absolute left-3 top-3.5 text-slate-500 transition" size={20} />
                      <input className="w-full pl-10 p-4 bg-slate-950 border border-slate-700 rounded-lg text-white" placeholder="Ej. 600 123 456" value={formData.telefono} onChange={e => setFormData({...formData, telefono: e.target.value})} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs text-slate-400 uppercase font-bold tracking-wider ml-1">Matrícula</label>
                    <div className="relative group">
                      <Car className="absolute left-3 top-3.5 text-slate-500 transition" size={20} />
                      <input className="w-full pl-10 p-4 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono text-xl" placeholder="0000 XXX" value={formData.matricula} onChange={e => setFormData({...formData, matricula: e.target.value.toUpperCase()})} />
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