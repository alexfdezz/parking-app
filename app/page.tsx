"use client";
import React, { useState, useEffect } from 'react';
import { Car, User, Save, Trash2, X, Phone, AlertTriangle, ArrowUp, ArrowDown, MapPin, ArrowRight, Calendar, ChevronLeft, ChevronRight, Euro } from 'lucide-react';

// --- TIPOS ---
interface PagosAnuales { [mes: string]: string; }

interface PlazaData {
  id_plaza: string;
  estado: string;
  nombre?: string;
  matricula?: string;
  telefono?: string;
  fecha_entrada?: string;
  pagos?: Record<string, PagosAnuales>; // AÑADIDO: Pagos
  _id?: string;
}

type PlazasState = Record<string, PlazaData>;

// --- CONFIGURACIÓN DE NUMERACIÓN (LA ORIGINAL QUE ESTABA BIEN) ---
const ZONAS = {
  A: Array.from({ length: 14 }, (_, i) => `A-${String(14 - i).padStart(2, '0')}`),
  B: Array.from({ length: 13 }, (_, i) => `B-${String(15 + i).padStart(2, '0')}`),
  C: Array.from({ length: 15 }, (_, i) => `C-${String(42 - i).padStart(2, '0')}`),
  D: Array.from({ length: 15 }, (_, i) => `D-${String(43 + i).padStart(2, '0')}`),
  E: Array.from({ length: 20 }, (_, i) => `E-${String(58 + i).padStart(2, '0')}`),
  F: Array.from({ length: 9 },  (_, i) => `F-${String(86 - i).padStart(2, '0')}`),
  M: Array.from({ length: 6 }, (_, i) => `M-${String(i + 1).padStart(2, '0')}`),
};

const MONTHS = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

export default function ParkingApp() {
  const [plazas, setPlazas] = useState<PlazasState>({});
  const [loading, setLoading] = useState(true);
  const [selectedPlaza, setSelectedPlaza] = useState<string | null>(null);
  
  // ESTADOS NUEVOS
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [activeTab, setActiveTab] = useState<'info' | 'pagos'>('info'); // Pestañas
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());
  
  const [formData, setFormData] = useState({ nombre: '', matricula: '', telefono: '' });

  // 1. CARGAR DATOS
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

  // 2. GUARDAR DATOS (LÓGICA UNIFICADA)
  const saveData = async (newDataPart: Partial<PlazaData>) => {
    if (!selectedPlaza) return;
    
    const currentData = plazas[selectedPlaza] || { id_plaza: selectedPlaza, estado: 'libre' };
    
    let nuevoEstado = currentData.estado;
    // Si mandamos matrícula, asumimos que se ocupa. Si no, mantenemos estado.
    if (newDataPart.matricula !== undefined) {
        nuevoEstado = newDataPart.matricula ? 'ocupada' : 'libre';
    }

    const finalData = { 
        ...currentData, 
        ...newDataPart, 
        estado: nuevoEstado,
        fecha_entrada: (nuevoEstado === 'ocupada' && !currentData.fecha_entrada) ? new Date().toISOString() : currentData.fecha_entrada
    };

    setPlazas((prev) => ({ ...prev, [selectedPlaza]: finalData as PlazaData }));
    
    await fetch('/api/plazas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(finalData)
    });
  };

  const handleGuardarInfo = () => {
      saveData(formData);
  };

  const updatePayment = (month: string, value: string) => {
    if (!selectedPlaza) return;
    const currentPagos = plazas[selectedPlaza]?.pagos || {};
    const pagosYear = currentPagos[selectedYear] || {};
    
    const newPagos = {
      ...currentPagos,
      [selectedYear]: { ...pagosYear, [month]: value }
    };
    saveData({ pagos: newPagos });
  };

  // 3. LIBERAR PLAZA
  const confirmarLiberacion = async () => {
    if (!selectedPlaza) return;

    // Borramos datos cliente PERO NO PAGOS
    const datosVacios: Partial<PlazaData> = {
      estado: 'libre',
      nombre: '', 
      matricula: '', 
      telefono: '',
      fecha_entrada: undefined
    };

    setPlazas((prev) => ({ ...prev, [selectedPlaza]: { ...prev[selectedPlaza], ...datosVacios } as PlazaData }));
    setSelectedPlaza(null);
    setFormData({ nombre: '', matricula: '', telefono: '' });
    setShowDeleteConfirm(false);

    await fetch('/api/plazas', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id_plaza: selectedPlaza, ...datosVacios }) });
  };

  // --- COMPONENTE: PLAZA ---
  const Plaza = ({ id, vertical = true }: { id: string, vertical?: boolean }) => {
    const data = plazas[id];
    const ocupada = data?.estado === 'ocupada';
    
    const isPlaza27 = id.includes('27'); // Detectamos la 27
    const isMoto = id.startsWith('M-'); 
    
    // Limpieza visual: quitamos letras (A-14 -> 14)
    const numeroVisible = isMoto ? id.replace('M-', '') : id.split('-')[1];

    let dimensionsClass = '';
    
    if (isMoto) {
        dimensionsClass = 'h-14 w-14 mb-1 flex-col justify-center items-center';
    } else if (isPlaza27) {
        // PLAZA 27: FORZADA VERTICAL (Alta y estrecha) y pegada a la derecha
        dimensionsClass = 'h-36 w-10 mt-1 flex-col items-center justify-between self-end'; 
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
          setActiveTab('info');
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
        <span className={`font-black text-center whitespace-nowrap
          ${isMoto ? 'text-[12px]' : 'text-[14px]'}
          ${isPlaza27 ? 'order-1' : ''} 
          /* Si es la 27, NO ROTAMOS */
          ${!isPlaza27 && !isMoto && !vertical ? '-rotate-90' : ''} 
          ${ocupada ? 'text-slate-500 opacity-50' : 'text-emerald-400 opacity-90'}
        `}>
            {numeroVisible}
        </span>

        {ocupada && data ? (
          <div className={`flex items-center gap-2 w-full justify-end overflow-hidden
            ${isMoto ? 'flex-col-reverse justify-center' : ''}
            ${isPlaza27 ? 'flex-col-reverse order-2' : ''} 
            ${!isPlaza27 && !isMoto && !vertical ? 'flex-col-reverse' : ''}
            ${!isPlaza27 && !isMoto && vertical ? 'flex-row-reverse' : ''}
          `}>
             <span className={`font-bold text-white bg-slate-950/80 px-1 border border-slate-700 rounded text-center truncate w-full 
               ${isMoto ? 'text-[8px] py-0.5' : 'text-[10px]'}
               ${isMoto ? '' : 'py-0.5'}
               ${!isPlaza27 && !isMoto && !vertical ? '[writing-mode:vertical-rl] py-1' : ''}
               ${isPlaza27 ? '[writing-mode:vertical-rl] py-1' : ''}
             `}>
               {data.nombre || 'Ocupado'}
             </span>
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
            {/* Pasillo */}
            <div className="w-24 border-x border-dashed border-slate-700/30 mx-2"></div>
            
            {/* ISLA CENTRAL (B y C) */}
            <div className="flex gap-0 relative bg-slate-800/30 p-2 rounded border border-slate-700/50">
              <div className="absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-4 bg-slate-800 border-l border-r border-slate-600 rounded"></div>
              
              <div className="flex flex-col pr-4">
                 <div className="text-center font-black text-slate-600 text-xl mb-2 tracking-widest border-b-2 border-slate-700 pb-1">B</div>
                 {/* FILTRO 27: La renderizamos aparte abajo para cambiarla */}
                 {ZONAS.B.filter((id: string) => !id.includes('27')).map((id: string) => <Plaza key={id} id={id} />)}
                 <Plaza id="B-27" />
              </div>

              <div className="flex flex-col pl-4">
                 <div className="text-center font-black text-slate-600 text-xl mb-2 tracking-widest border-b-2 border-slate-700 pb-1">C</div>
                 {ZONAS.C.map((id: string) => <Plaza key={id} id={id} />)}
              </div>
            </div>
            {/* Pasillo */}
            <div className="w-24 border-x border-dashed border-slate-700/30 mx-2"></div>

            {/* ZONA D */}
            <div className="flex flex-col">
              <div className="text-center font-black text-slate-600 text-xl mb-2 tracking-widest border-b-2 border-slate-700 pb-1">D</div>
              {ZONAS.D.map((id: string) => <Plaza key={id} id={id} />)}
            </div>
            {/* Pasillo */}
            <div className="w-24 border-x border-dashed border-slate-700/30 mx-2"></div>

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
               {/* Grid 2 columnas para motos */}
               <div className="grid grid-cols-2 gap-2 bg-slate-800/50 p-2 rounded border-2 border-dashed border-yellow-500/20">
                  {ZONAS.M.map((id: string) => <Plaza key={id} id={id} />)}
               </div>
            </div>

            <div className="flex flex-col w-full relative z-10">
               <div className="text-left font-black text-slate-600 text-xl mb-2 ml-2 tracking-widest">F</div>
               <div className="flex gap-1">
                  {ZONAS.F.map((id: string) => <Plaza key={id} id={id} vertical={false} />)}
               </div>
               
               <div className="flex justify-around mt-4 opacity-20 w-full pr-32">
                   <ArrowRight size={40} strokeWidth={3} className="text-slate-500"/>
                   <ArrowRight size={40} strokeWidth={3} className="text-slate-500"/>
                   <ArrowRight size={40} strokeWidth={3} className="text-slate-500"/>
               </div>
            </div>
          </div>
        </div>
      </div>

      {/* --- MODAL (CON CLICK FUERA PARA CERRAR) --- */}
      {selectedPlaza && (
        <div 
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => setSelectedPlaza(null)} // CERRAR AL TOCAR LO NEGRO
        >
          <div 
            className="bg-slate-900 border border-slate-700 rounded-xl shadow-[0_0_50px_rgba(0,0,0,0.5)] w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()} // Evitar cerrar al tocar dentro
          >
            <div className="bg-slate-950 p-4 border-b border-slate-800 flex justify-between items-center">
               <div className="flex items-center gap-4">
                 <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight flex items-center gap-2">
                    <span className="text-emerald-500">PLAZA</span> {selectedPlaza.split('-')[1] || selectedPlaza}
                 </h2>
                 {/* PESTAÑAS */}
                 <div className="flex bg-slate-800 rounded-lg p-1 border border-slate-700">
                    <button onClick={() => setActiveTab('info')} className={`px-3 py-1 md:px-4 md:py-1.5 rounded-md text-xs md:text-sm font-bold transition flex items-center gap-2 ${activeTab === 'info' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}><User size={14}/> Info</button>
                    <button onClick={() => setActiveTab('pagos')} className={`px-3 py-1 md:px-4 md:py-1.5 rounded-md text-xs md:text-sm font-bold transition flex items-center gap-2 ${activeTab === 'pagos' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'}`}><Euro size={14}/> Pagos</button>
                 </div>
               </div>
               <button onClick={() => setSelectedPlaza(null)} className="p-2 hover:bg-slate-800 rounded-full text-slate-400"><X /></button>
            </div>
            
            <div className="p-6 overflow-y-auto">
              {/* --- PESTAÑA INFO --- */}
              {activeTab === 'info' && (
                <div className="space-y-4">
                   <div className="grid grid-cols-2 gap-4">
                     <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700">
                        <label className="text-xs text-slate-500 uppercase font-black tracking-widest">Cliente</label>
                        <input className="w-full bg-transparent text-white font-medium mt-1 outline-none" placeholder="Nombre" value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value})} />
                     </div>
                     <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700">
                        <label className="text-xs text-slate-500 uppercase font-black tracking-widest">Teléfono</label>
                        <input className="w-full bg-transparent text-white font-medium mt-1 outline-none" placeholder="Teléfono" value={formData.telefono} onChange={e => setFormData({...formData, telefono: e.target.value})} />
                     </div>
                   </div>

                   <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700">
                      <label className="text-xs text-slate-500 uppercase font-black tracking-widest">Matrícula</label>
                      <input className="w-full bg-transparent text-3xl font-mono font-bold text-white tracking-widest outline-none uppercase" placeholder="0000 XXX" value={formData.matricula} onChange={e => setFormData({...formData, matricula: e.target.value.toUpperCase()})} />
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
                           <button onClick={handleGuardarInfo} className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-500 transition flex justify-center gap-2 items-center"><Save size={18} /> GUARDAR</button>
                        </>
                     )}
                   </div>
                </div>
              )}

              {/* --- PESTAÑA PAGOS --- */}
              {activeTab === 'pagos' && (
                <div className="space-y-6">
                   <div className="flex justify-between items-center bg-slate-950 p-2 rounded-lg border border-slate-800">
                      <button onClick={() => setSelectedYear(String(Number(selectedYear)-1))} className="p-2 hover:bg-slate-800 rounded-md text-slate-400"><ChevronLeft/></button>
                      <div className="flex items-center gap-2 text-xl font-bold text-white"><Calendar size={20} className="text-emerald-500"/><span className="font-mono">{selectedYear}</span></div>
                      <button onClick={() => setSelectedYear(String(Number(selectedYear)+1))} className="p-2 hover:bg-slate-800 rounded-md text-slate-400"><ChevronRight/></button>
                   </div>
                   <div className="grid grid-cols-2 gap-3">
                      {MONTHS.map(mes => {
                        const valor = plazas[selectedPlaza]?.pagos?.[selectedYear]?.[mes] || "";
                        const hayPago = valor.length > 0;
                        return (
                          <div key={mes} className={`p-3 rounded-lg border ${hayPago ? 'bg-emerald-900/20 border-emerald-500/50' : 'bg-slate-800 border-slate-700'}`}>
                             <div className="flex justify-between items-center mb-1"><span className={`text-[10px] font-black uppercase ${hayPago ? 'text-emerald-400' : 'text-slate-500'}`}>{mes}</span>{hayPago && <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>}</div>
                             <input className={`w-full bg-transparent outline-none font-mono text-sm border-b border-transparent focus:border-slate-500 pb-1 ${hayPago ? 'text-white font-bold' : 'text-slate-400'}`} placeholder="Sin pago..." value={valor} onChange={(e) => updatePayment(mes, e.target.value)} />
                          </div>
                        )
                      })}
                   </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}