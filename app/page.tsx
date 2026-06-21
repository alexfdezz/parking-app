"use client";
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Car, User, Save, Trash2, X, Phone, AlertTriangle, ArrowUp, ArrowDown, MapPin, ArrowRight, Calendar, ChevronLeft, ChevronRight, Euro, Banknote, Download, Upload, FileText } from 'lucide-react';
import Image from 'next/image';

// --- TIPOS ---
interface PagosAnuales { [mes: string]: string; }

interface PlazaData {
  id_plaza: string;
  estado: string;
  nombre?: string;
  matricula?: string;
  telefono?: string;
  fecha_entrada?: string;
  importeMensual?: string;
  notas?: string;
  pagos?: Record<string, PagosAnuales>;
  _id?: string;
  isBank?: boolean;
}

type PlazasState = Record<string, PlazaData>;

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
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [activeTab, setActiveTab] = useState<'info' | 'pagos'>('info'); 
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());
  const [formData, setFormData] = useState({ nombre: '', matricula: '', telefono: '', importeMensual: '', notas: '' });
  const [isBankMode, setIsBankMode] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'todas'|'ocupadas'|'libres'|'mora'|'banco'>('todas');
  const [toast, setToast] = useState<{ message: string; type: 'success'|'error' } | null>(null);
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const importFileRef = useRef<HTMLInputElement>(null);

  const showToast = useCallback((message: string, type: 'success'|'error' = 'success') => {
    setToast({ message, type });
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = setTimeout(() => setToast(null), 2500);
  }, []);
  
  // --- FUNCIONES DE LÓGICA DE ESTADO (Tipadas y en orden) ---

  // Función Principal de Lógica de Pagos y Mora (MODIFICADA)
  const getPaymentStatus = (id: string) => {
    const data = plazas[id];
    if (!data || data.estado !== 'ocupada') return { status: 'LIBRE', color: 'bg-emerald-900/20', facturar: false, mora: false, monthsToFacturar: [] as string[] };

    const today = new Date();
    const currentYear = today.getFullYear().toString();
    const currentMonthIndex = today.getMonth(); // 0 (Enero) a 11 (Diciembre)
    const isBank = data.isBank ?? false;
    
    const pagosYear = data.pagos?.[currentYear] || {};

    let status = 'AL DIA';
    let color = 'bg-blue-900/80';
    let facturar = false;
    let mora = false;
    let monthsToFacturar: string[] = [];

    // --- CAMBIO: LÓGICA DE MORA CORREGIDA ---
    // Recorremos desde Enero hasta el mes ACTUAL
    for (let i = 0; i <= currentMonthIndex; i++) {
        const monthName = MONTHS[i];
        const monthPaidStatus = pagosYear[monthName];
        
        // La mora se activa si el mes está vacío/impagado (no tiene texto o es "FACTURADO" por error, o vacío "")
        // y NO es el mes actual.
        if (i < currentMonthIndex) { 
            if (!monthPaidStatus || monthPaidStatus === "FACTURADO" || monthPaidStatus === "") {
                mora = true;
                break;
            }
        }
        
        // Si es el mes ACTUAL y no tiene pago registrado, se considera mora (rojo) 
        // para dar aviso visual inmediatamente.
        if (i === currentMonthIndex && (!monthPaidStatus || monthPaidStatus === "FACTURADO" || monthPaidStatus === "")) {
             mora = true;
             break;
        }
    }
    // FIN LÓGICA DE MORA CORREGIDA

    // --- LÓGICA DE FACTURACIÓN (AMARILLO) ---
    if (isBank) {
      const q = Math.floor(currentMonthIndex / 3); 
      const facturationMonthIndex = [2, 5, 8, 11].find(m => m === currentMonthIndex);
      
      const currentQuarterMonths = [MONTHS[q * 3], MONTHS[q * 3 + 1], MONTHS[q * 3 + 2]];

      if (facturationMonthIndex !== undefined) {
        // Verifica si los 3 meses del trimestre *anterior* tienen un pago REGISTRADO (no FACTURADO)
        const allPaid = currentQuarterMonths.every(m => pagosYear[m] && pagosYear[m] !== "FACTURADO");
        const anyFacturado = currentQuarterMonths.some(m => pagosYear[m] === "FACTURADO");

        if (allPaid && !anyFacturado) {
          facturar = true;
          status = 'FACTURAR';
          color = 'bg-yellow-900/60';
          monthsToFacturar = currentQuarterMonths;
        }
      }
    }
    
    // El estado de Mora (ROJO) tiene la máxima prioridad visual.
    if (mora) {
        status = 'MORA';
        color = 'bg-red-900/80';
        facturar = false;
    } else if (facturar) {
        status = 'FACTURAR';
        color = 'bg-yellow-900/60';
    } else if (data.estado === 'ocupada') {
        status = 'AL DIA';
        color = 'bg-blue-900/80';
    }


    return { status, color, facturar, mora, monthsToFacturar };
  };

  const saveData = async (newDataPart: Partial<PlazaData>) => {
    if (!selectedPlaza) return;
    const currentData = plazas[selectedPlaza] || { id_plaza: selectedPlaza, estado: 'libre' };
    let nuevoEstado = currentData.estado;
    if (newDataPart.matricula !== undefined) {
        nuevoEstado = newDataPart.matricula ? 'ocupada' : 'libre';
    }
    const finalData = {
        ...currentData,
        ...newDataPart,
        id_plaza: selectedPlaza,
        estado: nuevoEstado,
        fecha_entrada: (nuevoEstado === 'ocupada' && !currentData.fecha_entrada) ? new Date().toISOString() : currentData.fecha_entrada,
        isBank: newDataPart.isBank ?? currentData.isBank ?? false,
    };
    setPlazas((prev) => ({ ...prev, [selectedPlaza]: finalData as PlazaData }));
    try {
      const res = await fetch('/api/plazas', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(finalData) });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Error desconocido' }));
        showToast(`❌ Error al guardar plaza ${selectedPlaza}: ${err.error}`, 'error');
        setPlazas((prev) => ({ ...prev, [selectedPlaza]: currentData as PlazaData }));
      } else {
        showToast('✅ Guardado correctamente');
      }
    } catch {
      showToast(`❌ Sin conexión al guardar plaza ${selectedPlaza}`, 'error');
      setPlazas((prev) => ({ ...prev, [selectedPlaza]: currentData as PlazaData }));
    }
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
  
  const confirmarLiberacion = async () => {
    if (!selectedPlaza) return;
    const datosVacios: Partial<PlazaData> = {
      estado: 'libre',
      nombre: '',
      matricula: '',
      telefono: '',
      importeMensual: '',
      notas: '',
      fecha_entrada: undefined
    };
    await fetch('/api/plazas', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id_plaza: selectedPlaza, ...datosVacios }) });
    setPlazas((prev) => ({ ...prev, [selectedPlaza]: { ...prev[selectedPlaza], ...datosVacios, pagos: {} } as PlazaData }));
    setSelectedPlaza(null);
    setFormData({ nombre: '', matricula: '', telefono: '', importeMensual: '', notas: '' });
    setShowDeleteConfirm(false);
  };
  
  const handleBackupState = () => {
    const fullState = {
        timestamp: new Date().toISOString(),
        clientData: plazas,
    };
    const jsonString = JSON.stringify(fullState, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const dateStr = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    a.download = `backup_parking_general_${dateStr}.json`;
    a.href = url;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('✅ Backup generado y descargado');
  };

  const handleGuardarInfo = () => {
      saveData(formData);
  };
  
  const toggleBankMode = () => {
    if (!selectedPlaza) return;
    const newBankState = !plazas[selectedPlaza]?.isBank;
    saveData({ isBank: newBankState });
  };
  
  const confirmFacturacion = () => {
    if (!selectedPlaza) return;
    const currentPagos = plazas[selectedPlaza]?.pagos || {};
    const year = selectedYear;
    
    const status = getPaymentStatus(selectedPlaza);
    
    if (!status.facturar) {
         showToast('No hay facturas pendientes para este trimestre', 'error');
         return;
    }
    
    const monthsToUpdate = status.monthsToFacturar;

    // Marcamos los meses del trimestre como "FACTURADO" (pago de impuestos confirmado)
    const newPagos = { ...currentPagos };
    newPagos[year] = { ...newPagos[year] }; 

    monthsToUpdate.forEach(month => {
        if (newPagos[year][month] && newPagos[year][month] !== "FACTURADO") {
             newPagos[year][month] = "FACTURADO"; 
        }
    });

    saveData({ pagos: newPagos });
    showToast(`✅ Impuestos confirmados: ${monthsToUpdate.join(', ')} ${year}`);
  };

  // --- ESTADÍSTICAS ---
  const stats = useMemo(() => {
    const allIds = Object.values(ZONAS).flat();
    let ocupadas = 0, libres = 0, mora = 0, banco = 0, ingresos = 0;
    allIds.forEach(id => {
      const p = plazas[id];
      const st = getPaymentStatus(id);
      if (p?.estado === 'ocupada') {
        ocupadas++;
        if (st.mora) mora++;
        if (p.isBank) banco++;
        if (p.importeMensual) {
          const v = parseFloat(p.importeMensual.replace(',', '.'));
          if (!isNaN(v)) ingresos += v;
        }
      } else {
        libres++;
      }
    });
    return { ocupadas, libres, mora, banco, ingresos };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plazas]);

  // --- MESES EN MORA ---
  const getMoraMonthsCount = (id: string): number => {
    const data = plazas[id];
    if (!data || data.estado !== 'ocupada') return 0;
    const today = new Date();
    const currentYear = today.getFullYear().toString();
    const pagosYear = data.pagos?.[currentYear] || {};
    let count = 0;
    for (let i = 0; i <= today.getMonth(); i++) {
      const val = pagosYear[MONTHS[i]];
      if (!val || val === '' || val === 'FACTURADO') count++;
    }
    return count;
  };

  // --- EXPORTAR MOROSOS ---
  const handleExportMorosos = () => {
    const allIds = Object.values(ZONAS).flat();
    const rows = [['Plaza','Cliente','Matrícula','Teléfono','Meses en mora']];
    allIds.forEach(id => {
      if (getPaymentStatus(id).mora) {
        const p = plazas[id];
        rows.push([id, p?.nombre||'', p?.matricula||'', p?.telefono||'', String(getMoraMonthsCount(id))]);
      }
    });
    if (rows.length === 1) { showToast('No hay plazas en mora', 'error'); return; }
    const csv = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `morosos_${new Date().toISOString().slice(0,10)}.csv`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast(`✅ CSV exportado con ${rows.length - 1} morosos`);
  };

  // --- IMPORTAR BACKUP ---
  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const json = JSON.parse(ev.target?.result as string);
        const data: PlazasState = json.clientData || json;
        if (typeof data !== 'object') throw new Error('Formato inválido');
        const entries = Object.values(data) as PlazaData[];
        await Promise.all(entries.map(p => fetch('/api/plazas', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(p) })));
        const mapa: PlazasState = {};
        entries.forEach(p => { mapa[p.id_plaza] = p; });
        setPlazas(mapa);
        showToast(`✅ Backup importado: ${entries.length} plazas restauradas`);
      } catch { showToast('❌ Error al importar el backup', 'error'); }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // --- FIN FUNCIONES DE LÓGICA DE ESTADO ---


  // --- HOOKS DE CARGA ---

  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
        // setZoom(0.3); // No aplicable a esta app
    }
    
    // 1. Cargar datos de Plazas (API existente)
    fetch('/api/plazas', { cache: 'no-store' })
      .then(res => res.json())
      .then((data: any) => {
        const mapa: PlazasState = {};
        if(Array.isArray(data)) {
            data.forEach((p: PlazaData) => {
                mapa[p.id_plaza] = { ...p, isBank: p.isBank ?? false }; // Inicializar isBank
            });
        }
        setPlazas(mapa);
        setLoading(false);
      })
      .catch((err) => console.error("Error cargando:", err));
  }, []);


  // --- COMPONENTE: PLAZA ---
  const Plaza = ({ id, vertical = true }: { id: string, vertical?: boolean }) => {
    const data = plazas[id];
    const ocupada = data?.estado === 'ocupada';
    const status = getPaymentStatus(id);
    const isMoto = id.startsWith('M-'); 
    const numeroVisible = isMoto ? id.replace('M-', '') : id.split('-')[1];

    // Filtro visual
    const matchesFilter = statusFilter === 'todas' ||
      (statusFilter === 'ocupadas' && ocupada) ||
      (statusFilter === 'libres' && !ocupada) ||
      (statusFilter === 'mora' && status.mora) ||
      (statusFilter === 'banco' && data?.isBank);
    const dimmed = !matchesFilter ? 'opacity-20 pointer-events-none' : '';

    // Lógica de estilos
    const statusClass = ocupada ? status.color : 'bg-emerald-900/20 hover:bg-emerald-800/40';
    const isPlaza27 = id.includes('27');
    let dimensionsClass = isMoto ? 'h-14 w-14 mb-1 flex-col justify-center items-center' :
                            isPlaza27 ? 'h-36 w-10 mt-1 flex-col items-center justify-between self-end' :
                            vertical ? 'h-10 w-36 mb-1 flex-row items-center justify-between' :
                            'h-36 w-10 mr-1 flex-col items-center justify-between';


    return (
      <div 
        onClick={() => {
          setSelectedPlaza(id);
          setShowDeleteConfirm(false); 
          
          setActiveTab('pagos');

          const data = plazas[id];
          const allPagos = data?.pagos || {};
          const yearsWithData = Object.keys(allPagos).filter(year => 
            Object.values(allPagos[year]).some(val => val && val.trim() !== "")
          );

          if (yearsWithData.length > 0) {
            const lastYear = Math.max(...yearsWithData.map(Number)).toString();
            setSelectedYear(lastYear);
          } else {
            setSelectedYear(new Date().getFullYear().toString());
          }

          if (ocupada && data) setFormData({ nombre: data.nombre || '', matricula: data.matricula || '', telefono: data.telefono || '', importeMensual: data.importeMensual || '', notas: data.notas || '' });
          else setFormData({ nombre: '', matricula: '', telefono: '', importeMensual: '', notas: '' });

        }}
        className={`
          relative cursor-pointer transition-all duration-300 group border-2 rounded-sm px-2
          ${dimmed}
          ${dimensionsClass}
          ${statusClass}
          ${status.mora ? 'border-red-500/80 shadow-[0_0_8px_rgba(239,68,68,0.4)]' : 
           status.facturar ? 'border-yellow-500/80 shadow-[0_0_8px_rgba(252,211,77,0.4)]' :
           ocupada ? 'border-blue-500/80 shadow-[0_0_8px_rgba(59,130,246,0.2)]' :
           'border-emerald-500/50 shadow-[0_0_5px_rgba(16,185,129,0.1)]'}
        `}
      >
        {/* Punto de aviso amarillo/rojo */}
        {ocupada && (status.mora || status.facturar) && (
            <div className={`absolute top-1 right-1 w-2 h-2 rounded-full z-10 ${status.mora ? 'bg-red-500' : 'bg-yellow-500'}`}></div>
        )}
        
        <span className={`font-black text-center whitespace-nowrap
          ${isMoto ? 'text-[12px]' : 'text-[14px]'}
          ${isPlaza27 ? 'order-1' : ''} 
          ${!isPlaza27 && !isMoto && !vertical ? '-rotate-90' : ''} 
          ${ocupada ? 'text-white opacity-90' : 'text-emerald-400 opacity-90'}
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
             <Image 
                 src="/espai-parking-logo.png" 
                 alt="ESPAI PARKING LOGO" 
                 width={48} 
                 height={48} 
                 className="w-10 h-10 object-contain"
             />
             <span className="text-2xl font-black">ESPAI</span> <span className="text-emerald-500 text-2xl font-black">PARKING</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1 ml-1">Control de acceso</p>
        </div>
        <div className="flex flex-col gap-2 items-end">
          {/* Fila 1: Stats */}
          <div className="flex gap-2 flex-wrap justify-end">
            <span className="bg-blue-900/60 text-blue-300 px-2 py-0.5 rounded-full text-xs font-bold">{stats.ocupadas} ocupadas</span>
            <span className="bg-emerald-900/60 text-emerald-300 px-2 py-0.5 rounded-full text-xs font-bold">{stats.libres} libres</span>
            {stats.mora > 0 && <span className="bg-red-900/60 text-red-300 px-2 py-0.5 rounded-full text-xs font-bold">{stats.mora} mora</span>}
            {stats.banco > 0 && <span className="bg-yellow-900/60 text-yellow-300 px-2 py-0.5 rounded-full text-xs font-bold">{stats.banco} banco</span>}
            {stats.ingresos > 0 && <span className="bg-purple-900/60 text-purple-300 px-2 py-0.5 rounded-full text-xs font-bold">{stats.ingresos.toFixed(0)}€/mes</span>}
            <div className="flex gap-1 text-xs font-mono bg-slate-950 border border-slate-700 px-2 py-0.5 rounded-full text-green-400 items-center">
              <div className={`w-2 h-2 rounded-full ${loading ? 'bg-yellow-500' : 'bg-green-500 animate-pulse'}`}></div>
              {loading ? 'SYNC...' : 'ONLINE'}
            </div>
          </div>
          {/* Fila 2: Botones y filtros */}
          <div className="flex gap-2 flex-wrap justify-end items-center">
            {/* Filtros */}
            {(['todas','ocupadas','libres','mora','banco'] as const).map(f => (
              <button key={f} onClick={() => setStatusFilter(f)}
                className={`px-2 py-0.5 rounded-full text-xs font-bold transition-all ${statusFilter === f ? 'bg-slate-400 text-slate-900' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}>
                {f.charAt(0).toUpperCase()+f.slice(1)}
              </button>
            ))}
            <div className="w-px h-4 bg-slate-600"/>
            <button onClick={() => setIsBankMode(prev => !prev)}
              className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 transition-all ${isBankMode ? 'bg-yellow-500 text-slate-900' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}>
              <Banknote size={12}/> {isBankMode ? 'BANCO ON' : 'BANCO'}
            </button>
            <button onClick={handleExportMorosos}
              className="bg-orange-700 hover:bg-orange-600 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 transition-all">
              <FileText size={12}/> Morosos
            </button>
            <button onClick={() => importFileRef.current?.click()}
              className="bg-slate-700 hover:bg-slate-600 text-slate-300 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 transition-all">
              <Upload size={12}/> Importar
            </button>
            <input ref={importFileRef} type="file" accept=".json" className="hidden" onChange={handleImportBackup}/>
            <button onClick={handleBackupState}
              className="bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 transition-all">
              <Download size={12}/> Backup
            </button>
          </div>
        </div>
      </header>

      {/* ... (Resto del Layout del Parking) ... */}
      <div className="overflow-auto pb-20 cursor-grab active:cursor-grabbing">
        <div className="min-w-fit bg-[#1e293b] p-10 rounded-xl shadow-2xl mx-auto w-fit border-4 border-slate-800 relative">
          
          <div className="absolute top-10 left-1/2 -translate-x-1/2 text-slate-800 text-6xl font-black tracking-[1em] opacity-30 select-none pointer-events-none">P1</div>

          <div className="flex justify-center items-start relative z-10 gap-0"> 
            <div className="flex flex-col">
              <div className="text-center font-black text-slate-600 text-xl mb-2 tracking-widest border-b-2 border-slate-700 pb-1">A</div>
              {ZONAS.A.map((id: string) => <Plaza key={id} id={id} />)}
            </div>
            <div className="w-24 border-x border-dashed border-slate-700/30 mx-2"></div>
            
            <div className="flex gap-0 relative bg-slate-800/30 p-2 rounded border border-slate-700/50">
              <div className="absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-4 bg-slate-800 border-l border-r border-slate-600 rounded"></div>
              <div className="flex flex-col pr-4">
                 <div className="text-center font-black text-slate-600 text-xl mb-2 tracking-widest border-b-2 border-slate-700 pb-1">B</div>
                 {ZONAS.B.filter((id: string) => !id.includes('27')).map((id: string) => <Plaza key={id} id={id} />)}
                 <Plaza id="B-27" />
              </div>
              <div className="flex flex-col pl-4">
                 <div className="text-center font-black text-slate-600 text-xl mb-2 tracking-widest border-b-2 border-slate-700 pb-1">C</div>
                 {ZONAS.C.map((id: string) => <Plaza key={id} id={id} />)}
              </div>
            </div>
            <div className="w-24 border-x border-dashed border-slate-700/30 mx-2"></div>
            <div className="flex flex-col">
              <div className="text-center font-black text-slate-600 text-xl mb-2 tracking-widest border-b-2 border-slate-700 pb-1">D</div>
              {ZONAS.D.map((id: string) => <Plaza key={id} id={id} />)}
            </div>
            <div className="w-24 border-x border-dashed border-slate-700/30 mx-2"></div>
             <div className="flex flex-col">
              <div className="text-center font-black text-slate-600 text-xl mb-2 tracking-widest border-b-2 border-slate-700 pb-1">E</div>
              {ZONAS.E.map((id: string) => <Plaza key={id} id={id} />)}
            </div>
          </div>

          <div className="mt-8 pt-8 border-t-4 border-dashed border-yellow-500/10 flex items-end pl-2 relative">
            <div className="flex flex-col mr-20 relative z-10 gap-2">
               <div className="text-center font-black text-slate-600 text-xs tracking-widest">MOTOS</div>
               <div className="grid grid-cols-2 gap-2 bg-slate-800/50 p-2 rounded border-2 border-dashed border-yellow-500/20">
                  {ZONAS.M.map((id: string) => <Plaza key={id} id={id} />)}
               </div>
            </div>
            <div className="flex flex-col w-full relative z-10">
               <div className="text-left font-black text-slate-600 text-xl mb-2 ml-2 tracking-widest">F</div>
               <div className="flex gap-1">
                  {ZONAS.F.map((id: string) => <Plaza key={id} id={id} vertical={false} />)}
               </div>
            </div>
          </div>
        </div>
      </div>
      {/* ... (Fin del Layout del Parking) ... */}


      {selectedPlaza && (
        <div 
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => setSelectedPlaza(null)}
        >
          <div 
            className="bg-slate-900 border border-slate-700 rounded-xl shadow-[0_0_50px_rgba(0,0,0,0.5)] w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-slate-950 p-4 border-b border-slate-800 flex justify-between items-center">
               <div className="flex items-center gap-4">
                 <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight flex items-center gap-2">
                    <span className="text-emerald-500">PLAZA</span> {selectedPlaza.split('-')[1] || selectedPlaza}
                 </h2>
                 <div className="flex bg-slate-800 rounded-lg p-1 border border-slate-700">
                    <button onClick={() => setActiveTab('info')} className={`px-3 py-1 md:px-4 md:py-1.5 rounded-md text-xs md:text-sm font-bold transition flex items-center gap-2 ${activeTab === 'info' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}><User size={14}/> Info</button>
                    <button onClick={() => setActiveTab('pagos')} className={`px-3 py-1 md:px-4 md:py-1.5 rounded-md text-xs md:text-sm font-bold transition flex items-center gap-2 ${activeTab === 'pagos' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'}`}><Euro size={14}/> Pagos</button>
                 </div>
               </div>
               <button onClick={() => setSelectedPlaza(null)} className="p-2 hover:bg-slate-800 rounded-full text-slate-400"><X /></button>
            </div>
            
            <div className="p-6 overflow-y-auto">
              {activeTab === 'info' && (
                <div className="space-y-4">
                  {/* Lógica para mostrar el estado del Banco */}
                   {plazas[selectedPlaza]?.estado === 'ocupada' && (
                       <div className={`bg-slate-800/50 p-4 rounded-lg border flex justify-between items-center ${plazas[selectedPlaza]?.isBank ? 'border-yellow-500/50' : 'border-slate-700'}`}>
                           <div className="flex flex-col">
                               <label className="text-xs text-slate-500 uppercase font-black tracking-widest mb-1">FACTURACIÓN TRIMESTRAL</label>
                               <span className={`font-bold text-sm ${plazas[selectedPlaza]?.isBank ? 'text-yellow-400' : 'text-slate-400'}`}>
                                   {plazas[selectedPlaza]?.isBank ? 'Activo (Aviso en Mar/Jun/Sep/Dic)' : 'Inactivo (Pago Mensual)'}
                               </span>
                           </div>
                           <button onClick={toggleBankMode} className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${plazas[selectedPlaza]?.isBank ? 'bg-yellow-500 text-slate-900 hover:bg-yellow-400' : 'bg-slate-700 text-white hover:bg-slate-600'}`}>
                               {plazas[selectedPlaza]?.isBank ? 'DESACTIVAR' : 'ACTIVAR'}
                           </button>
                       </div>
                   )}
                   {/* FIN CAMBIO DE BANCO */}

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
                   <div className="grid grid-cols-2 gap-4">
                     <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700">
                       <label className="text-xs text-slate-500 uppercase font-black tracking-widest">Importe mensual (€)</label>
                       <input className="w-full bg-transparent text-white font-medium mt-1 outline-none" placeholder="Ej: 80" value={formData.importeMensual} onChange={e => setFormData({...formData, importeMensual: e.target.value})} />
                     </div>
                     {plazas[selectedPlaza]?.fecha_entrada && (
                       <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700">
                         <label className="text-xs text-slate-500 uppercase font-black tracking-widest">Fecha entrada</label>
                         <p className="text-white font-medium mt-1 text-sm">{new Date(plazas[selectedPlaza].fecha_entrada!).toLocaleDateString('es-ES')}</p>
                       </div>
                     )}
                   </div>
                   <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700">
                     <label className="text-xs text-slate-500 uppercase font-black tracking-widest">Notas</label>
                     <textarea className="w-full bg-transparent text-white font-medium mt-1 outline-none resize-none" rows={2} placeholder="Observaciones..." value={formData.notas} onChange={e => setFormData({...formData, notas: e.target.value})} />
                   </div>
                   {getMoraMonthsCount(selectedPlaza) > 0 && (
                     <div className="bg-red-900/20 border border-red-500/50 p-3 rounded-lg flex items-center gap-2 text-red-400 font-bold text-sm">
                       <AlertTriangle size={16}/> {getMoraMonthsCount(selectedPlaza)} {getMoraMonthsCount(selectedPlaza) === 1 ? 'mes en mora' : 'meses en mora'}
                     </div>
                   )}
                   <div className="pt-4 flex gap-3">
                     {plazas[selectedPlaza]?.estado === 'ocupada' ? (
                        showDeleteConfirm ? (
                          <div className="w-full bg-red-900/20 border border-red-500/50 p-4 rounded-lg flex flex-col gap-3 animate-in fade-in zoom-in-95">
                            <div className="flex items-center gap-2 text-red-400 font-bold justify-center text-sm"><AlertTriangle size={18}/><span>¿Estás seguro?</span></div>
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
                        )
                     ) : (
                        <button onClick={handleGuardarInfo} className="w-full bg-emerald-500 text-slate-900 py-4 rounded-lg font-black tracking-wide hover:bg-emerald-400 transition flex justify-center gap-2 items-center shadow-lg shadow-emerald-900/20"><Save size={20} /> REGISTRAR ENTRADA</button>
                     )}
                   </div>
                </div>
              )}

              {activeTab === 'pagos' && (
                <div className="space-y-6">
                   <div className="flex justify-between items-center bg-slate-950 p-2 rounded-lg border border-slate-800">
                      <button onClick={() => setSelectedYear(String(Number(selectedYear)-1))} className="p-2 hover:bg-slate-800 rounded-md text-slate-400"><ChevronLeft/></button>
                      <div className="flex items-center gap-2 text-xl font-bold text-white"><Calendar size={20} className="text-emerald-500"/><span className="font-mono">{selectedYear}</span></div>
                      <button onClick={() => setSelectedYear(String(Number(selectedYear)+1))} className="p-2 hover:bg-slate-800 rounded-md text-slate-400"><ChevronRight/></button>
                   </div>
                   
                   {/* Botón de Confirmar Facturación (solo si está en modo banco) */}
                   {plazas[selectedPlaza]?.isBank && getPaymentStatus(selectedPlaza).facturar && (
                       <div className="bg-yellow-900/20 border border-yellow-500/50 p-3 rounded-lg flex items-center justify-between">
                           <div className="flex items-center gap-2 text-yellow-400 font-bold">
                               <AlertTriangle size={18}/>
                               <span>CONFIRMAR PAGO de Impuestos TRIMESTRALES</span>
                           </div>
                           <button onClick={confirmFacturacion} className="bg-yellow-600 text-slate-900 px-3 py-1 rounded-full text-xs font-bold hover:bg-yellow-500 transition-all">CONFIRMAR</button>
                       </div>
                   )}
                   {/* FIN CAMBIO BOTÓN FACTURACIÓN */}

                   <div className="grid grid-cols-2 gap-3">
                      {MONTHS.map((mes, index) => {
                        const valor = plazas[selectedPlaza]?.pagos?.[selectedYear]?.[mes] || "";
                        const status = getPaymentStatus(selectedPlaza);
                        
                        // Estilo condicional para Facturar/Mora
                        let monthClass = 'bg-slate-800 border-slate-700'; // Default
                        let facturacionAviso = false;
                        let isMora = false;

                        // 1. Comprobación de Mora: Meses anteriores + Mes Actual si está vacío
                        const isCurrentYear = selectedYear === new Date().getFullYear().toString();
                        const isMonthPastOrPresent = isCurrentYear && MONTHS.indexOf(mes) <= new Date().getMonth();
                        
                        if (isMonthPastOrPresent) {
                            if (!valor || valor === "FACTURADO" || valor === "") {
                                isMora = true;
                                monthClass = 'bg-red-900/20 border-red-500/50';
                            }
                        }

                        // 2. Comprobación de Facturación (Amarillo): Tiene prioridad sobre Pagado/Impagado
                        if (plazas[selectedPlaza]?.isBank && status.facturar && status.monthsToFacturar.includes(mes)) {
                             monthClass = 'bg-yellow-900/20 border-yellow-500/50'; // Mes a facturar
                             facturacionAviso = true;
                             isMora = false; // El aviso de Facturación anula la mora visual
                        } else if (valor.length > 0 && !isMora) {
                            // 3. Pagado (verde): Solo si hay valor y no está en mora
                             monthClass = 'bg-emerald-900/20 border-emerald-500/50';
                        }
                        // Nota: Si isMora es true, el monthClass ya es rojo desde el paso 1


                        return (
                          <div key={mes} className={`p-3 rounded-lg border ${monthClass}`}>
                             <div className="flex justify-between items-center mb-1">
                                <span className={`text-[10px] font-black uppercase ${monthClass.includes('emerald') ? 'text-emerald-400' : monthClass.includes('red') ? 'text-red-400' : monthClass.includes('yellow') ? 'text-yellow-400' : 'text-slate-500'}`}>{mes}</span>
                                {(valor.length > 0 && !facturacionAviso && !monthClass.includes('red')) && <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>}
                                {facturacionAviso && <AlertTriangle size={14} className="text-yellow-500"/>}
                             </div>
                             <input 
                                className={`w-full bg-transparent outline-none font-mono text-sm border-b border-transparent focus:border-slate-500 pb-1 ${valor.length > 0 && !monthClass.includes('red') ? 'text-white font-bold' : 'text-slate-400'}`} 
                                placeholder="Sin pago..." 
                                value={valor} 
                                onChange={(e) => updatePayment(mes, e.target.value)} 
                             />
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

      {/* TOAST */}
      {toast && (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-[9999] px-5 py-3 rounded-xl shadow-2xl text-white font-bold text-sm flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-300 ${toast.type === 'success' ? 'bg-emerald-600 border border-emerald-400' : 'bg-red-600 border border-red-400'}`}>
          {toast.message}
        </div>
      )}
    </div>
  );
}