"use client";
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Car, User, Save, Trash2, X, MapPin, Euro, Calendar, ChevronLeft, ChevronRight, Move, RotateCw, ArrowUp, ArrowDown, ArrowLeft, ArrowRight as ArrowRightIcon, Search, List, ZoomIn, ZoomOut, AlertTriangle, Banknote, Download, Upload, FileText } from 'lucide-react';

// --- TIPOS ---
interface PagosAnuales { [mes: string]: string; }
interface PlazaData {
  id_plaza: string;
  estado: string;
  nombre?: string;
  matricula?: string;
  telefono?: string;
  fechaInicio?: string;
  importeMensual?: string;
  notas?: string;
  pagos?: Record<string, PagosAnuales>;
  isBank?: boolean;
}
type PlazasState = Record<string, PlazaData>;

// --- ZONAS Y NUMERACIÓN ---
const ZONES = {
  PERIMETRO_IZQ: Array.from({ length: 29 }, (_, i) => String(105 + (i * 2))),
  PERIMETRO_ARR: Array.from({ length: 18 }, (_, i) => String(93 - (i * 2))),
  PERIMETRO_DER: ["000", "00", "0", ...Array.from({ length: 29 }, (_, i) => String(1 + (i * 2)))],
  PERIMETRO_ABAJO_L: Array.from({ length: 17 }, (_, i) => String(163 + (i * 2))),
  PERIMETRO_ABAJO_R: Array.from({ length: 9 }, (_, i) => String(197 + (i * 2))),
  ISLA_DERECHA_L: Array.from({ length: 17 }, (_, i) => String(68 - (i * 4))),
  ISLA_DERECHA_R: Array.from({ length: 17 }, (_, i) => String(66 - (i * 4))),
  ISLA_AMARILLA_L: ["100", "98", "96", "TACHADO", "94", "HUECO_ESTRUCTURA", "88", "84", "80", "76", "72"],
  ISLA_AMARILLA_R: ["92", "90", "86", "82", "78", "74", "70"],
  ISLA_ROSA_COPA: ["172", "170", "168", "166", "164", "162"],
  ISLA_ROSA_L: Array.from({ length: 14 }, (_, i) => String(160 - (i * 4))),
  ISLA_ROSA_R: Array.from({ length: 14 }, (_, i) => String(158 - (i * 4))),
  ISLA_ROSA_BASE: ["180", "178", "176", "174", "104", "102"]
};

// --- TUS COORDENADAS FIJAS ---
const INITIAL_CONFIG = {
  p_izq: { x: 419, y: 213, rotate: 0, gap: 2 },
  p_arr: { x: 475, y: 133, rotate: 0, gap: 2 },
  p_der: { x: 1291, y: 108, rotate: 159, gap: 1 },
  p_abajo_l: { x: 545, y: 1172, rotate: 0, gap: 2 },
  p_abajo_r: { x: 1249, y: 1172, rotate: 0, gap: 2 },
  isla_rosa: { x: 544, y: 396, rotate: 3, gap: 2 },
  isla_amarilla: { x: 863, y: 635, rotate: 0, gap: 2 },
  isla_derecha: { x: 1070, y: 410, rotate: -17, gap: 2 },
  motos: { x: 484, y: 1147, rotate: 0, gap: 0 },
  entrada_1: { x: 1078, y: 1172, rotate: 0, gap: 0 },
  entrada_2: { x: 400, y: 1172, rotate: 0, gap: 0 },
  entrada_3: { x: 1500, y: 500, rotate: 90, gap: 0 }
};

// --- AJUSTES INDIVIDUALES ---
const INITIAL_INDIVIDUAL = {
    "0": { x: 0, y: 36, r: 0 }, "1": { x: 0, y: 36, r: 0 }, "3": { x: 0, y: 36, r: 0 }, "4": { x: 0, y: 24, r: 0 },
    "5": { x: 0, y: 36, r: 0 }, "7": { x: 0, y: 36, r: 0 }, "8": { x: 0, y: 24, r: 0 }, "9": { x: 0, y: 36, r: 0 },
    "11": { x: 0, y: 36, r: 0 }, "12": { x: 0, y: 24, r: 0 }, "13": { x: 0, y: 36, r: 0 }, "15": { x: 0, y: 36, r: 0 },
    "16": { x: 0, y: 24, r: 0 }, "17": { x: 0, y: 36, r: 0 }, "19": { x: 0, y: 36, r: 0 }, "20": { x: 0, y: 24, r: 0 },
    "21": { x: 0, y: 36, r: 0 }, "23": { x: 0, y: 36, r: 0 }, "24": { x: 0, y: 24, r: 0 }, "25": { x: 0, y: 36, r: 0 },
    "27": { x: -16, y: 20, r: -90 },
    "28": { x: 0, y: 24, r: 0 }, "32": { x: 0, y: 24, r: 0 }, "36": { x: 0, y: 24, r: 0 }, "40": { x: 0, y: 24, r: 0 },
    "44": { x: 0, y: 24, r: 0 }, "48": { x: 0, y: 24, r: 0 }, "50": { x: 0, y: 0, r: 0 }, "52": { x: 0, y: 24, r: 0 },
    "56": { x: 0, y: 24, r: 0 }, "60": { x: 0, y: 24, r: 0 }, "64": { x: 0, y: 24, r: 0 }, "68": { x: 0, y: 24, r: 0 },
    "70": { x: 0, y: 64, r: 0 }, "74": { x: 0, y: 64, r: 0 }, "78": { x: 0, y: 64, r: 0 }, "82": { x: 0, y: 64, r: 0 },
    "86": { x: 0, y: 64, r: 0 }, "90": { x: -41, y: 64, r: 0 }, "92": { x: -41, y: 64, r: 0 }, "94": { x: 25, y: -32, r: 0 },
    "96": { x: 25, y: -33, r: 0 }, "98": { x: 25, y: -33, r: 0 }, "100": { x: 25, y: -33, r: 0 }, "102": { x: 8, y: -6, r: 0 },
    "104": { x: 8, y: -6, r: 0 }, "108": { x: 0, y: 16, r: 0 }, "112": { x: 0, y: 16, r: 0 }, "116": { x: 0, y: 16, r: 0 },
    "120": { x: 0, y: 16, r: 0 }, "124": { x: 0, y: 16, r: 0 }, "128": { x: 0, y: 16, r: 0 }, "132": { x: 0, y: 16, r: 0 },
    "136": { x: 0, y: 16, r: 0 }, "140": { x: 0, y: 16, r: 0 }, "144": { x: 0, y: 16, r: 0 }, "148": { x: 0, y: 16, r: 0 },
    "152": { x: 0, y: 16, r: 0 }, "156": { x: 0, y: 16, r: 0 }, "160": { x: 0, y: 16, r: 0 }, "162": { x: 8, y: 22, r: 0 },
    "163": { x: 2, y: 0, r: 0 }, "164": { x: 8, y: 22, r: 0 }, "166": { x: 8, y: 22, r: 0 }, "167": { x: -3, y: 0, r: 0 },
    "168": { x: 8, y: 22, r: 0 }, "169": { x: -5, y: 0, r: 0 }, "170": { x: 8, y: 22, r: 0 }, "171": { x: -8, y: 0, r: 0 },
    "172": { x: 8, y: 22, r: 0 }, "173": { x: -11, y: 0, r: 0 }, "174": { x: 8, y: -6, r: 0 }, "175": { x: -14, y: 0, r: 0 },
    "176": { x: 8, y: -6, r: 0 }, "177": { x: -17, y: 0, r: 0 }, "178": { x: 8, y: -6, r: 0 }, "179": { x: -20, y: 0, r: 0 },
    "180": { x: 8, y: -6, r: 0 }, "181": { x: -23, y: 0, r: 0 }, "183": { x: -26, y: 0, r: 0 }, "185": { x: -29, y: 0, r: 0 },
    "187": { x: -32, y: 0, r: 0 }, "189": { x: -35, y: 0, r: 0 }, "191": { x: -38, y: 0, r: 0 }, "193": { x: -41, y: 0, r: 0 },
    "195": { x: -44, y: 0, r: 0 }, "197": { x: -74, y: 0, r: 0 }, "199": { x: -77, y: 0, r: 0 }, "201": { x: -80, y: 0, r: 0 },
    "203": { x: -83, y: 0, r: 0 }, "205": { x: -86, y: 0, r: 0 }, "207": { x: -89, y: 0, r: 0 }, "209": { x: -92, y: 0, r: 0 },
    "211": { x: -95, y: 0, r: 0 },
    "213": { x: -98, y: 0, r: 0 },
    "00": { x: 0, y: 36, r: 0 }, "000": { x: 0, y: 36, r: 0 },
    "TACHADO": { x: 25, y: -33, r: 0 }
};

const MONTHS = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

// --- LISTADO COMPONENT ---
function ListadoPlazas({
  searchTerm,
  setSearchTerm,
  filteredPlazas,
  plazas,
  onSelect,
  listFilter,
  setListFilter,
  getPaymentStatus,
}: {
  searchTerm: string;
  setSearchTerm: (v: string) => void;
  filteredPlazas: string[];
  plazas: PlazasState;
  onSelect: (id: string) => void;
  listFilter: 'todas' | 'ocupadas' | 'libres' | 'mora' | 'banco';
  setListFilter: (v: 'todas' | 'ocupadas' | 'libres' | 'mora' | 'banco') => void;
  getPaymentStatus: (id: string) => { status: string; color: string; facturar: boolean; mora: boolean; monthsToFacturar: string[] };
}) {
  const filterButtons: { key: 'todas' | 'ocupadas' | 'libres' | 'mora' | 'banco'; label: string; color: string }[] = [
    { key: 'todas', label: 'Todas', color: 'bg-slate-600 hover:bg-slate-500' },
    { key: 'ocupadas', label: 'Ocupadas', color: 'bg-blue-700 hover:bg-blue-600' },
    { key: 'libres', label: 'Libres', color: 'bg-emerald-700 hover:bg-emerald-600' },
    { key: 'mora', label: 'En mora', color: 'bg-red-700 hover:bg-red-600' },
    { key: 'banco', label: 'Banco', color: 'bg-yellow-600 hover:bg-yellow-500' },
  ];

  const visiblePlazas = filteredPlazas.filter(id => {
    const p = plazas[id];
    if (listFilter === 'todas') return true;
    if (listFilter === 'ocupadas') return p?.estado === 'ocupada';
    if (listFilter === 'libres') return !p || p.estado !== 'ocupada';
    if (listFilter === 'mora') return getPaymentStatus(id).mora;
    if (listFilter === 'banco') return p?.isBank === true;
    return true;
  });

  return (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b border-slate-800 space-y-2 sticky top-0 bg-slate-900 z-10">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-8 pr-3 py-2 text-sm text-white placeholder-slate-500 outline-none focus:border-blue-500"
            placeholder="Buscar plaza, cliente, matrícula..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-1">
          {filterButtons.map(fb => (
            <button
              key={fb.key}
              onClick={() => setListFilter(fb.key)}
              className={`px-2 py-0.5 rounded-full text-xs font-bold text-white transition-all ${listFilter === fb.key ? fb.color + ' ring-2 ring-white/30' : 'bg-slate-800 hover:bg-slate-700'}`}
            >
              {fb.label}
            </button>
          ))}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        {visiblePlazas.map(id => {
          const p = plazas[id];
          const ocupada = p?.estado === 'ocupada';
          const status = getPaymentStatus(id);
          return (
            <div
              key={id}
              onClick={() => onSelect(id)}
              className={`p-3 border-b border-slate-800/60 cursor-pointer hover:bg-slate-800/60 transition flex items-center gap-3 ${status.mora ? 'bg-red-900/10' : status.facturar ? 'bg-yellow-900/10' : ''}`}
            >
              <div className={`w-8 h-8 rounded-md flex items-center justify-center text-xs font-black shrink-0 ${ocupada ? (status.mora ? 'bg-red-800 text-white' : status.facturar ? 'bg-yellow-700 text-white' : 'bg-blue-800 text-white') : 'bg-emerald-900/50 text-emerald-400'}`}>
                {id}
              </div>
              <div className="min-w-0 flex-1">
                {ocupada ? (
                  <>
                    <div className="text-sm font-bold text-white truncate">{p?.nombre || 'Sin nombre'}</div>
                    <div className="text-xs text-slate-400 font-mono truncate">{p?.matricula || ''}</div>
                  </>
                ) : (
                  <div className="text-sm text-emerald-500 font-bold">LIBRE</div>
                )}
              </div>
              {status.mora && <span className="text-[10px] font-black text-red-400 shrink-0">MORA</span>}
              {status.facturar && !status.mora && <span className="text-[10px] font-black text-yellow-400 shrink-0">BANCO</span>}
            </div>
          );
        })}
        {visiblePlazas.length === 0 && (
          <div className="p-6 text-center text-slate-500 text-sm">Sin resultados</div>
        )}
      </div>
    </div>
  );
}

// --- CONTROL PANEL COMPONENT ---
function ControlPanel({
  activeZone,
  activeIndividual,
  config,
  individualOverrides,
  updateZoneConfig,
  updateIndividualConfig,
  startAction,
  stopAction,
  adjustValue,
}: {
  activeZone: keyof typeof INITIAL_CONFIG | null;
  activeIndividual: string | null;
  config: typeof INITIAL_CONFIG;
  individualOverrides: Record<string, { x: number; y: number; r: number }>;
  updateZoneConfig: (key: keyof typeof INITIAL_CONFIG, vals: any) => void;
  updateIndividualConfig: (id: string, field: 'x' | 'y' | 'r', value: number) => void;
  startAction: (action: () => void) => void;
  stopAction: () => void;
  adjustValue: (type: 'zone' | 'individual', field: string, delta: number) => void;
}) {
  const ArrowBtn = ({ onClick, children }: { onClick: () => void; children: React.ReactNode }) => (
    <button
      onMouseDown={() => startAction(onClick)}
      onMouseUp={stopAction}
      onMouseLeave={stopAction}
      onTouchStart={(e) => { e.preventDefault(); startAction(onClick); }}
      onTouchEnd={stopAction}
      className="w-10 h-10 bg-slate-700 hover:bg-slate-600 rounded flex items-center justify-center text-white font-bold active:bg-slate-500 select-none"
    >
      {children}
    </button>
  );

  return (
    <div className="p-4 space-y-4">
      {activeZone && (
        <div className="bg-slate-800 rounded-lg p-3 space-y-3 border border-slate-700">
          <div className="text-xs font-black text-yellow-400 uppercase tracking-widest">Zona: {activeZone}</div>
          <div className="grid grid-cols-3 gap-1 w-fit mx-auto">
            <div></div>
            <ArrowBtn onClick={() => adjustValue('zone', 'y', -1)}><ArrowUp size={16}/></ArrowBtn>
            <div></div>
            <ArrowBtn onClick={() => adjustValue('zone', 'x', -1)}><ArrowLeft size={16}/></ArrowBtn>
            <div className="w-10 h-10 bg-slate-900 rounded flex items-center justify-center text-slate-500 text-xs">XY</div>
            <ArrowBtn onClick={() => adjustValue('zone', 'x', 1)}><ArrowRightIcon size={16}/></ArrowBtn>
            <div></div>
            <ArrowBtn onClick={() => adjustValue('zone', 'y', 1)}><ArrowDown size={16}/></ArrowBtn>
            <div></div>
          </div>
          <div className="flex gap-2 items-center justify-center">
            <ArrowBtn onClick={() => adjustValue('zone', 'rotate', -1)}><RotateCw size={16} className="scale-x-[-1]"/></ArrowBtn>
            <span className="text-xs text-slate-400">R: {config[activeZone].rotate}°</span>
            <ArrowBtn onClick={() => adjustValue('zone', 'rotate', 1)}><RotateCw size={16}/></ArrowBtn>
          </div>
          <div className="text-xs text-slate-500 text-center">X:{config[activeZone].x} Y:{config[activeZone].y}</div>
        </div>
      )}
      {activeIndividual && (
        <div className="bg-slate-800 rounded-lg p-3 space-y-3 border border-slate-700">
          <div className="text-xs font-black text-pink-400 uppercase tracking-widest">Individual: {activeIndividual}</div>
          <div className="grid grid-cols-3 gap-1 w-fit mx-auto">
            <div></div>
            <ArrowBtn onClick={() => adjustValue('individual', 'y', -1)}><ArrowUp size={16}/></ArrowBtn>
            <div></div>
            <ArrowBtn onClick={() => adjustValue('individual', 'x', -1)}><ArrowLeft size={16}/></ArrowBtn>
            <div className="w-10 h-10 bg-slate-900 rounded flex items-center justify-center text-slate-500 text-xs">XY</div>
            <ArrowBtn onClick={() => adjustValue('individual', 'x', 1)}><ArrowRightIcon size={16}/></ArrowBtn>
            <div></div>
            <ArrowBtn onClick={() => adjustValue('individual', 'y', 1)}><ArrowDown size={16}/></ArrowBtn>
            <div></div>
          </div>
          <div className="flex gap-2 items-center justify-center">
            <ArrowBtn onClick={() => adjustValue('individual', 'r', -1)}><RotateCw size={16} className="scale-x-[-1]"/></ArrowBtn>
            <span className="text-xs text-slate-400">R: {(individualOverrides[activeIndividual] || { r: 0 }).r}°</span>
            <ArrowBtn onClick={() => adjustValue('individual', 'r', 1)}><RotateCw size={16}/></ArrowBtn>
          </div>
          <div className="text-xs text-slate-500 text-center">
            X:{(individualOverrides[activeIndividual] || { x: 0 }).x} Y:{(individualOverrides[activeIndividual] || { y: 0 }).y}
          </div>
        </div>
      )}
      {!activeZone && !activeIndividual && (
        <div className="text-center text-slate-500 text-sm p-4">
          Haz clic en una zona o plaza para editarla
        </div>
      )}
    </div>
  );
}

// --- COMPONENTE PRINCIPAL ---
export default function ParkingComplex() {
  const [plazas, setPlazas] = useState<PlazasState>({});
  const [selectedPlaza, setSelectedPlaza] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'info' | 'pagos'>('info');
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());
  const [formData, setFormData] = useState({ nombre: '', matricula: '', telefono: '', fechaInicio: '', importeMensual: '', notas: '' });
  const [searchTerm, setSearchTerm] = useState('');

  // IMPROVEMENT 3: list filter state
  const [listFilter, setListFilter] = useState<'todas' | 'ocupadas' | 'libres' | 'mora' | 'banco'>('todas');

  const [isMobileListOpen, setIsMobileListOpen] = useState(false);
  const [zoom, setZoom] = useState(0.9);

  const [editMode, setEditMode] = useState(false);
  const [config, setConfig] = useState<typeof INITIAL_CONFIG>(INITIAL_CONFIG);
  const [individualOverrides, setIndividualOverrides] = useState<Record<string, {x: number, y: number, r: number}>>(INITIAL_INDIVIDUAL);
  const [activeZone, setActiveZone] = useState<keyof typeof INITIAL_CONFIG | null>(null);
  const [activeIndividual, setActiveIndividual] = useState<string | null>(null);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const [isBankMode, setIsBankMode] = useState(false);

  // IMPROVEMENT 1: Toast state
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // IMPROVEMENT 10: import file ref
  const importFileRef = useRef<HTMLInputElement>(null);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // IMPROVEMENT 1: Show toast helper
  const showToast = useCallback((message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = setTimeout(() => setToast(null), 2500);
  }, []);


  // --- LÓGICA DE ESTADO Y UTILIDADES ---

  // FUNCIÓN AUXILIAR: Comprueba si un mes está pagado o cubierto por un pago posterior
  const isMonthPaidOrCovered = (monthIndex: number, year: string, pagos: Record<string, PagosAnuales>): boolean => {
    const pagosYear = pagos[year] || {};
    const monthName = MONTHS[monthIndex];

    // 1. Comprueba si el mes tiene un valor (pago directo) y no es solo el marcador "FACTURADO"
    if (pagosYear[monthName] && pagosYear[monthName] !== "FACTURADO" && pagosYear[monthName] !== "") {
        return true;
    }

    // 2. Comprueba si algún mes POSTERIOR tiene un pago con fecha que cubra el mes actual
    for (let i = monthIndex + 1; i < MONTHS.length; i++) {
        const subsequentPayment = pagosYear[MONTHS[i]];
        if (subsequentPayment && subsequentPayment !== "FACTURADO" && subsequentPayment !== "") {
            // Buscamos la fecha de la nota "HASTA dd/mm/yy" o similar
            const matches = subsequentPayment.match(/(\d{1,2})\/(\d{1,2})\/(\d{2,4})/);
            if (matches) {
                const day = parseInt(matches[1]);
                const month = parseInt(matches[2]) - 1; // 0-11
                const yearFull = (matches[3].length === 2 ? 2000 + parseInt(matches[3]) : parseInt(matches[3]));

                // Creamos un objeto Date para la fecha límite
                const coveredUntil = new Date(yearFull, month, day);

                // Creamos un objeto Date para el FINAL del mes que estamos comprobando (monthIndex)
                const monthToCheckEnd = new Date(parseInt(year), monthIndex + 1, 0); // Último día del mes

                // Si la fecha límite de pago es posterior o igual al final del mes que comprobamos
                if (coveredUntil.getTime() >= monthToCheckEnd.getTime()) {
                    return true;
                }
            }
        }
    }

    // Comprobación especial: Si la nota del mes actual (monthName) incluye "HASTA..."
    const currentMonthPayment = pagosYear[monthName];
    if (currentMonthPayment && currentMonthPayment !== "FACTURADO" && currentMonthPayment.toLowerCase().includes('hasta')) {
         return true;
    }

    return false;
  };

  // Lógica de Pagos y Mora (Corregida con Cobertura)
  const getPaymentStatus = useCallback((id: string) => {
    const data = plazas[id];
    if (!data || data.estado !== 'ocupada') return { status: 'LIBRE', color: 'bg-emerald-900/20', facturar: false, mora: false, monthsToFacturar: [] as string[] };

    const today = new Date();
    const currentYear = today.getFullYear().toString();
    const currentMonthIndex = today.getMonth();
    const isBank = data.isBank ?? false;

    const pagos = data.pagos || {};

    let status = 'AL DIA';
    let color = 'bg-blue-900/80';
    let facturar = false;
    let mora = false;
    let monthsToFacturar: string[] = [];

    // LÓGICA DE MORA (ROJO): Comprueba todos los meses pasados y el actual
    for (let i = 0; i <= currentMonthIndex; i++) {
        const isCovered = isMonthPaidOrCovered(i, currentYear, pagos);

        // Si es un mes pasado o presente Y NO está cubierto, es Mora.
        if (i < currentMonthIndex || (i === currentMonthIndex)) {
             if (!isCovered) {
                mora = true;
                break;
             }
        }
    }

    // LÓGICA DE FACTURACIÓN (AMARILLO)
    if (isBank) {
      const q = Math.floor(currentMonthIndex / 3);
      const facturationMonthIndex = [2, 5, 8, 11].find(m => m === currentMonthIndex);

      const currentQuarterMonths = [MONTHS[q * 3], MONTHS[q * 3 + 1], MONTHS[q * 3 + 2]];

      if (facturationMonthIndex !== undefined) {
        // Verifica si los 3 meses del trimestre están cubiertos (pago directo o por cobertura)
        const allCovered = currentQuarterMonths.every(m => isMonthPaidOrCovered(MONTHS.indexOf(m), currentYear, pagos));
        const allFacturado = currentQuarterMonths.every(m => pagos[currentYear]?.[m] === "FACTURADO");

        if (allCovered && !allFacturado) {
          facturar = true;
          status = 'FACTURAR';
          color = 'bg-yellow-900/60';
          monthsToFacturar = currentQuarterMonths;
        }
      }
    }

    // Prioridad visual
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
  }, [plazas]);

  // IMPROVEMENT 9: Count months in mora for a plaza
  const getMoraMonthsCount = (id: string): number => {
    const data = plazas[id];
    if (!data || data.estado !== 'ocupada') return 0;
    const today = new Date();
    const currentYear = today.getFullYear().toString();
    const currentMonthIndex = today.getMonth();
    const pagos = data.pagos || {};
    let count = 0;
    for (let i = 0; i <= currentMonthIndex; i++) {
      const isCovered = isMonthPaidOrCovered(i, currentYear, pagos);
      if (!isCovered) count++;
    }
    return count;
  };

  // Función para alternar el modo Banco en una plaza
  const toggleBankMode = () => {
    if (!selectedPlaza) return;
    const newBankState = !plazas[selectedPlaza]?.isBank;
    saveData({ isBank: newBankState });
  };

  // Función para confirmar pago de impuestos (Quita aviso amarillo)
  const confirmFacturacion = () => {
    if (!selectedPlaza) return;
    const currentPagos = plazas[selectedPlaza]?.pagos || {};
    const year = selectedYear;

    const status = getPaymentStatus(selectedPlaza);

    if (!status.facturar) {
         showToast("No hay facturas pendientes de confirmar para este trimestre.", 'error');
         return;
    }

    const monthsToUpdate = status.monthsToFacturar;

    const newPagos = { ...currentPagos };
    newPagos[year] = { ...newPagos[year] };

    monthsToUpdate.forEach(month => {
        if (newPagos[year][month] && newPagos[year][month] !== "FACTURADO") {
             newPagos[year][month] = "FACTURADO";
        }
    });

    saveData({ pagos: newPagos });
  };

  // --- FUNCIÓN DE CARGA DE CONFIGURACIÓN ---
  const loadLayoutConfig = async () => {
      try {
          const res = await fetch('/api/config', { cache: 'no-store' });
          if (res.ok) {
              const data = await res.json();
              if (data.zones && data.individual) {
                  setConfig(data.zones as typeof INITIAL_CONFIG);
                  setIndividualOverrides(data.individual);
              }
          }
      } catch (e) {
          console.error("Error al cargar la configuración de layout desde la API:", e);
      }
  }

  // --- HOOKS DE CARGA ---
  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
        setZoom(0.3);
    }

    // 1. Cargar datos de Plazas
    fetch('/api/plazas', { cache: 'no-store' })
      .then(res => res.json())
      .then(data => {
        const mapa: PlazasState = {};
        if (Array.isArray(data)) data.forEach((p: PlazaData) => mapa[p.id_plaza] = { ...p, isBank: p.isBank ?? false });
        setPlazas(mapa);
      });

    // 2. Cargar la configuración de Layout desde el servidor
    loadLayoutConfig();
  }, []);

  // --- ALL PLAZAS LIST ---
  const allPlazasList = useMemo(() => {
    const list = Object.values(ZONES).flat().filter(id => id !== "HUECO_ESTRUCTURA" && id !== "TACHADO");
    list.sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));
    return list;
  }, []);

  // IMPROVEMENT 4: filteredPlazas also searches by telefono
  const filteredPlazas = allPlazasList.filter(id => {
      const p = plazas[id];
      const search = searchTerm.toLowerCase();
      return id.toLowerCase().includes(search) ||
             (p?.nombre && p.nombre.toLowerCase().includes(search)) ||
             (p?.matricula && p.matricula.toLowerCase().includes(search)) ||
             (p?.telefono && p.telefono.toLowerCase().includes(search));
  });

  // IMPROVEMENT 2: Stats computation
  const stats = useMemo(() => {
    let totalOcupadas = 0;
    let totalLibres = 0;
    let totalMora = 0;
    let totalBanco = 0;
    let totalIngresoMensual = 0;

    allPlazasList.forEach(id => {
      const p = plazas[id];
      if (p?.estado === 'ocupada') {
        totalOcupadas++;
        const st = getPaymentStatus(id);
        if (st.mora) totalMora++;
        if (p.isBank && st.facturar) totalBanco++;
        if (p.importeMensual) {
          const val = parseFloat(p.importeMensual.replace(',', '.'));
          if (!isNaN(val)) totalIngresoMensual += val;
        }
      } else {
        totalLibres++;
      }
    });

    return { totalOcupadas, totalLibres, totalMora, totalBanco, totalIngresoMensual };
  }, [plazas, allPlazasList, getPaymentStatus]);

  const stopAction = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (intervalRef.current) clearInterval(intervalRef.current);
    window.removeEventListener('mouseup', stopAction);
  };
  const startAction = (action: () => void) => {
    stopAction(); action(); window.addEventListener('mouseup', stopAction);
    timeoutRef.current = setTimeout(() => { intervalRef.current = setInterval(action, 30); }, 400);
  };
  const adjustValue = (type: 'zone' | 'individual', field: string, delta: number) => {
    if (type === 'zone' && activeZone) {
        setConfig(prev => {
            const currentZone = prev[activeZone];
            return { ...prev, [activeZone]: { ...currentZone, [field]: (currentZone as any)[field] + delta } };
        });
    } else if (type === 'individual' && activeIndividual) {
        setIndividualOverrides(prev => {
            const current = prev[activeIndividual] || { x: 0, y: 0, r: 0 };
            return { ...prev, [activeIndividual]: { ...current, [field]: (current as any)[field] + delta } };
        });
    }
  };
  const updateZoneConfig = (key: keyof typeof INITIAL_CONFIG, newValues: any) => {
    setConfig(prev => ({ ...prev, [key]: { ...prev[key], ...newValues } }));
  };
  const updateIndividualConfig = (id: string, field: 'x'|'y'|'r', value: number) => {
    setIndividualOverrides(prev => ({ ...prev, [id]: { ...(prev[id] || {x:0, y:0, r:0}), [field]: value } }));
  };

  // Guarda la configuración de Layout en el backend
  const saveLayoutToBackend = async () => {
    const fullConfig = { zones: config, individual: individualOverrides };

    try {
        const res = await fetch('/api/config', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(fullConfig)
        });
        if (res.ok) {
            showToast("Configuracion de Layout guardada en el servidor.", 'success');
        } else {
            showToast("Error al guardar la configuracion en el servidor.", 'error');
        }
    } catch (e) {
        showToast("Error de conexion al guardar el layout.", 'error');
    }
  };

  const copyConfigToClipboard = () => {
    const fullConfig = { zones: config, individual: individualOverrides };
    navigator.clipboard.writeText(JSON.stringify(fullConfig, null, 2));
    showToast("Configuracion de Layout copiada!", 'success');
  };

  const handleBackupState = () => {
    const fullState = {
        timestamp: new Date().toISOString(),
        parkingConfig: {
            zones: config,
            individual: individualOverrides,
        },
        clientData: plazas,
    };
    const jsonString = JSON.stringify(fullState, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const dateStr = new Date().toISOString().replace(/[:.]/g, '-');
    a.download = `backup_parking_completo_${dateStr}.json`;
    a.href = url;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast("Backup generado correctamente!", 'success');
  };

  // IMPROVEMENT 8: Export morosos CSV
  const handleExportMorosos = () => {
    const morosos = allPlazasList.filter(id => getPaymentStatus(id).mora);
    if (morosos.length === 0) {
      showToast("No hay plazas en mora actualmente.", 'error');
      return;
    }
    const rows = [['Plaza', 'Cliente', 'Matricula', 'Telefono', 'Meses en mora']];
    morosos.forEach(id => {
      const p = plazas[id];
      const meses = getMoraMonthsCount(id);
      rows.push([id, p?.nombre || '', p?.matricula || '', p?.telefono || '', String(meses)]);
    });
    const csv = rows.map(r => r.map(cell => `"${cell.replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const dateStr = new Date().toISOString().replace(/[:.]/g, '-');
    a.download = `morosos_parking_${dateStr}.csv`;
    a.href = url;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast(`CSV exportado con ${morosos.length} morosos.`, 'success');
  };

  // IMPROVEMENT 10: Import backup
  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const json = JSON.parse(ev.target?.result as string);
        if (!json.clientData) {
          showToast("El archivo no tiene un campo 'clientData' valido.", 'error');
          return;
        }
        const clientData: PlazasState = json.clientData;
        const entries = Object.values(clientData);
        let errors = 0;
        for (const plaza of entries) {
          try {
            const res = await fetch('/api/plazas', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(plaza),
            });
            if (!res.ok) errors++;
          } catch {
            errors++;
          }
        }
        setPlazas(clientData);
        if (errors === 0) {
          showToast(`Backup restaurado: ${entries.length} plazas importadas.`, 'success');
        } else {
          showToast(`Backup parcial: ${entries.length - errors}/${entries.length} plazas importadas.`, 'error');
        }
      } catch {
        showToast("Error al leer el archivo JSON.", 'error');
      }
      // reset so same file can be selected again
      if (importFileRef.current) importFileRef.current.value = '';
    };
    reader.readAsText(file);
  };

  // IMPROVEMENT 1: saveData with toast
  const saveData = async (newDataPart: Partial<PlazaData>) => {
    if (!selectedPlaza) return;
    const currentData = plazas[selectedPlaza] || { id_plaza: selectedPlaza, estado: 'libre' };
    let nuevoEstado = currentData.estado;
    if (newDataPart.matricula !== undefined) nuevoEstado = newDataPart.matricula ? 'ocupada' : 'libre';
    const finalData = {
        ...currentData,
        ...newDataPart,
        id_plaza: selectedPlaza,
        estado: nuevoEstado,
        isBank: newDataPart.isBank ?? currentData.isBank ?? false,
    };
    setPlazas(prev => ({ ...prev, [selectedPlaza]: finalData as PlazaData }));
    try {
      const res = await fetch('/api/plazas', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(finalData) });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Error desconocido' }));
        showToast(`Error al guardar la plaza ${selectedPlaza}: ${err.error || 'Error de red'}`, 'error');
        setPlazas(prev => ({ ...prev, [selectedPlaza]: currentData as PlazaData }));
      } else {
        showToast("Guardado correctamente", 'success');
      }
    } catch {
      showToast(`No se pudo conectar con el servidor al guardar la plaza ${selectedPlaza}.`, 'error');
      setPlazas(prev => ({ ...prev, [selectedPlaza]: currentData as PlazaData }));
    }
  };

  const updatePayment = (month: string, value: string) => {
    if (!selectedPlaza) return;
    const currentPagos = plazas[selectedPlaza]?.pagos || {};
    const pagosYear = currentPagos[selectedYear] || {};
    const newPagos = { ...currentPagos, [selectedYear]: { ...pagosYear, [month]: value } };
    saveData({ pagos: newPagos });
  };

  const liberarPlaza = () => {
    if(!selectedPlaza) return;
    saveData({ nombre: '', matricula: '', telefono: '', fechaInicio: '', importeMensual: '', notas: '' });
    setFormData({ nombre: '', matricula: '', telefono: '', fechaInicio: '', importeMensual: '', notas: '' });
    setShowDeleteConfirm(false);
  };
  const confirmarLiberacion = () => {
    liberarPlaza();
    setShowDeleteConfirm(false);
  };

  // --- LÓGICA DE SELECCIÓN ---
  const handleSelectPlaza = (id: string) => {
    const data = plazas[id];
    if (!data && id === "TACHADO") return;

    setSelectedPlaza(id);
    setIsMobileListOpen(false);
    setActiveTab('info');
    setShowDeleteConfirm(false);
    // IMPROVEMENTS 5, 6, 7: initialize new form fields
    setFormData({
      nombre: data?.nombre || '',
      matricula: data?.matricula || '',
      telefono: data?.telefono || '',
      fechaInicio: data?.fechaInicio || '',
      importeMensual: data?.importeMensual || '',
      notas: data?.notas || '',
    });

    // Detectar el año del último pago
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
  };

  // --- UI COMPONENTS ---
  const Plaza = ({ id, className = "" }: { id: string, className?: string }) => {
    if (id === "HUECO_ESTRUCTURA") return <div className={`h-8 w-16 bg-transparent border-none ${className}`}></div>;
    const isTachado = id === "TACHADO";
    const data = plazas[id];
    const ocupada = data?.estado === 'ocupada';

    if (isTachado) {
        return (
             <div className={`cursor-default text-[10px] font-bold flex items-center justify-center relative border border-slate-600 bg-slate-800/50 ${className}`}>
                 <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                     <X className="text-slate-500 opacity-50 w-full h-full" strokeWidth={1} />
                 </div>
             </div>
        );
    }

    const status = getPaymentStatus(id);
    const statusClass = ocupada ? status.color : 'bg-emerald-900/40 hover:bg-emerald-800/40';

    const isPlaza27 = id === '27';
    const isPerimetroDer = ZONES.PERIMETRO_DER.includes(id);

    const override = individualOverrides[id] || { x: 0, y: 0, r: 0 };
    const isSelectedForEdit = editMode && activeIndividual === id;
    let standardClass = isPlaza27 ? 'h-16 w-8 flex-col self-end mb-1' : className;

    const getTextStyle = () => {
        if (id === '27') return { transform: 'rotate(90deg)' };
        if (isPerimetroDer) return { transform: 'rotate(200deg)' };
        return {};
    };

    return (
      <div
        onClick={(e) => {
            e.stopPropagation();
            if(editMode) { setActiveIndividual(id); setActiveZone(null); return; }
            handleSelectPlaza(id);
        }}
        style={{ transform: `translate(${override.x}px, ${override.y}px) rotate(${override.r}deg)`, zIndex: isSelectedForEdit ? 100 : 1 }}
        className={`cursor-pointer text-[10px] font-bold flex items-center justify-center relative transition-all shadow-sm border border-slate-500
        ${editMode && isSelectedForEdit ? 'border-2 border-pink-500 ring-2 ring-pink-500/50 z-50' : 'border border-slate-500'}
        ${!editMode && 'hover:scale-110 hover:z-50'}
        ${statusClass} ${standardClass}
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

        <span className={`z-10 ${isPerimetroDer ? 'block' : ''}`} style={getTextStyle()}>{id}</span>
        {ocupada && <Car size={14} className={`absolute opacity-30 ${isPlaza27 ? 'rotate-90' : ''}`} />}
      </div>
    );
  };

  const DraggableZone = ({ idKey, children }: { idKey: keyof typeof INITIAL_CONFIG, children: React.ReactNode }) => {
    const pos = config[idKey];
    const isSelected = editMode && activeZone === idKey;
    const isEntrance = idKey.startsWith('entrada');
    const label = isEntrance ? idKey.toUpperCase().replace('_', ' ') : idKey.toUpperCase();

    return (
      <div onClick={(e) => { e.stopPropagation(); if(editMode) { setActiveZone(idKey); setActiveIndividual(null); } }}
        style={{ position: 'absolute', left: pos.x, top: pos.y, transform: `rotate(${pos.rotate}deg)`, border: isSelected ? '2px dashed yellow' : (editMode ? '1px dashed rgba(255,255,255,0.1)' : 'none'), padding: editMode ? '10px' : '0', zIndex: isSelected ? 50 : 1, transition: 'transform 0.1s ease-out' }}>
        {editMode && <div className="absolute -top-6 left-0 bg-yellow-600 text-white text-[10px] px-1 font-bold rounded opacity-50">{label}</div>}
        <div style={{ display: 'flex', flexDirection: isEntrance && pos.rotate % 180 !== 0 ? 'column' : 'inherit', gap: `${pos.gap}px` }}>
             {React.Children.map(children, child => {
                if (React.isValidElement(child)) {
                    // @ts-ignore
                    return React.cloneElement(child, { style: { ...child.props.style, gap: `${pos.gap}px` } });
                }
                return child;
             })}
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen bg-[#0f172a] text-slate-200 overflow-hidden font-sans selection:bg-blue-500 selection:text-white flex flex-col md:flex-row">

      {/* IMPROVEMENT 1: Toast notification */}
      {toast && (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-[9999] px-5 py-3 rounded-xl shadow-2xl text-white font-bold text-sm flex items-center gap-2 transition-all animate-in fade-in slide-in-from-top-2 duration-300 ${toast.type === 'success' ? 'bg-emerald-600 border border-emerald-400' : 'bg-red-600 border border-red-400'}`}>
          <span>{toast.type === 'success' ? '✅' : '❌'}</span>
          <span>{toast.message}</span>
        </div>
      )}

      <button onClick={() => setIsMobileListOpen(true)} className="md:hidden fixed bottom-6 right-6 z-[60] bg-blue-600 text-white p-4 rounded-full shadow-2xl flex items-center justify-center hover:bg-blue-500 transition-all active:scale-95"><List size={24} /></button>
      <div className="fixed bottom-6 left-6 z-[50] flex flex-col gap-2">
         <button onClick={() => setZoom(z => Math.min(z + 0.2, 5))} className="bg-slate-800/80 p-3 rounded-full border border-slate-600 text-white backdrop-blur hover:bg-slate-700"><ZoomIn size={20}/></button>
         <button onClick={() => setZoom(z => Math.max(z - 0.2, 0.2))} className="bg-slate-800/80 p-3 rounded-full border border-slate-600 text-white backdrop-blur hover:bg-slate-700"><ZoomOut size={20}/></button>
      </div>

      {isMobileListOpen && (
          <div className="fixed inset-0 z-[100] bg-slate-900 flex flex-col md:hidden animate-in slide-in-from-bottom duration-300">
             <div className="flex justify-end p-2"><button onClick={() => setIsMobileListOpen(false)} className="p-2"><X size={24}/></button></div>
             <ListadoPlazas
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                filteredPlazas={filteredPlazas}
                plazas={plazas}
                onSelect={handleSelectPlaza}
                listFilter={listFilter}
                setListFilter={setListFilter}
                getPaymentStatus={getPaymentStatus}
             />
          </div>
      )}

      {editMode && (
          <div className="hidden md:flex w-80 bg-slate-900 border-r border-slate-700 p-0 flex-col gap-4 shadow-2xl z-[500] shrink-0 h-screen overflow-y-auto">
             <div className="p-4 bg-slate-950 border-b border-slate-800 sticky top-0 space-y-4">
                 <h3 className="font-black text-white flex items-center gap-2 text-xl"><Move size={24} className="text-yellow-500"/> EDITOR PRO</h3>
                 <button onClick={() => setEditMode(false)} className="w-full py-2 bg-red-600/20 hover:bg-red-600/40 text-red-200 border border-red-500/50 rounded font-bold flex items-center justify-center gap-2 transition-all"><X size={18}/> SALIR DEL EDITOR</button>
             </div>

             <ControlPanel
                activeZone={activeZone} activeIndividual={activeIndividual} config={config} individualOverrides={individualOverrides}
                updateZoneConfig={updateZoneConfig} updateIndividualConfig={updateIndividualConfig}
                startAction={startAction} stopAction={stopAction} adjustValue={adjustValue}
             />

             <div className="mt-auto p-6 border-t border-slate-800 space-y-3 pb-20">
                <button onClick={handleBackupState} className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95"><Save size={18}/> BACKUP COMPLETO</button>
                <button onClick={saveLayoutToBackend} className="w-full py-3 bg-green-600 hover:bg-green-500 text-white font-bold rounded-lg flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95"><Save size={18}/> GUARDAR LAYOUT EN API</button>
                <button onClick={copyConfigToClipboard} className="w-full py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 font-bold rounded-lg flex items-center justify-center gap-2 transition-all text-sm"><Move size={18}/> Copiar Config. a Portapapeles</button>
             </div>
          </div>
      )}

      <div className="flex-1 flex relative h-full overflow-hidden">

        <div className="flex-1 relative overflow-auto bg-[#0f172a] h-full flex justify-center items-start pt-20 pl-10">
            <div className="hidden md:block fixed top-4 left-8 z-[200]">
                <button onClick={() => setEditMode(!editMode)} className={`px-6 py-2 rounded-full font-black flex items-center gap-2 shadow-lg transition-all border ${editMode ? 'bg-yellow-500 text-black border-yellow-400 scale-105' : 'bg-slate-800 text-white border-slate-600 hover:bg-slate-700'}`}>
                    {editMode ? <X size={20}/> : <RotateCw size={20}/>} {editMode ? 'SALIR' : 'EDITAR'}
                </button>
            </div>

            {/* IMPROVEMENT 2: Stats bar */}
            <div className="hidden md:flex fixed top-4 left-1/2 -translate-x-1/2 z-[200] items-center gap-2 bg-slate-900/90 border border-slate-700 rounded-full px-4 py-1.5 shadow-lg backdrop-blur">
              <span className="flex items-center gap-1 text-xs font-bold text-blue-300">
                <span className="inline-block w-2 h-2 rounded-full bg-blue-500"></span>
                {stats.totalOcupadas} ocup.
              </span>
              <span className="text-slate-600">|</span>
              <span className="flex items-center gap-1 text-xs font-bold text-emerald-300">
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
                {stats.totalLibres} libres
              </span>
              <span className="text-slate-600">|</span>
              <span className="flex items-center gap-1 text-xs font-bold text-red-300">
                <span className="inline-block w-2 h-2 rounded-full bg-red-500"></span>
                {stats.totalMora} mora
              </span>
              <span className="text-slate-600">|</span>
              <span className="flex items-center gap-1 text-xs font-bold text-yellow-300">
                <span className="inline-block w-2 h-2 rounded-full bg-yellow-500"></span>
                {stats.totalBanco} banco
              </span>
              {stats.totalIngresoMensual > 0 && (
                <>
                  <span className="text-slate-600">|</span>
                  <span className="flex items-center gap-1 text-xs font-bold text-purple-300">
                    <Euro size={10}/>
                    {stats.totalIngresoMensual.toFixed(0)}/mes
                  </span>
                </>
              )}
            </div>

            <div className="fixed top-4 right-8 z-[200] flex gap-2">
                 <button
                     onClick={() => setIsBankMode(prev => !prev)}
                     className={`px-3 py-1.5 rounded-full font-bold flex items-center gap-2 transition-all shadow-md active:scale-95 ${isBankMode ? 'bg-yellow-500 text-slate-900 hover:bg-yellow-400' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
                 >
                     <Banknote size={14}/> {isBankMode ? 'BANCO: ACTIVO' : 'BANCO: INACTIVO'}
                 </button>
                 {/* IMPROVEMENT 8: Export morosos button */}
                 <button
                   onClick={handleExportMorosos}
                   className="px-3 py-1.5 rounded-full font-bold flex items-center gap-2 bg-slate-800 text-slate-300 hover:bg-red-900/60 hover:text-red-200 transition-all shadow-md active:scale-95"
                   title="Exportar listado de morosos CSV"
                 >
                   <FileText size={14}/> Morosos
                 </button>
                 {/* IMPROVEMENT 10: Import backup button */}
                 <button
                   onClick={() => importFileRef.current?.click()}
                   className="px-3 py-1.5 rounded-full font-bold flex items-center gap-2 bg-slate-800 text-slate-300 hover:bg-indigo-900/60 hover:text-indigo-200 transition-all shadow-md active:scale-95"
                   title="Importar backup JSON"
                 >
                   <Upload size={14}/> Importar
                 </button>
                 <input
                   ref={importFileRef}
                   type="file"
                   accept=".json"
                   className="hidden"
                   onChange={handleImportBackup}
                 />
            </div>


            <div id="map-container" style={{ transform: `scale(${zoom})`, transformOrigin: 'top left' }} className="relative w-[3000px] h-[2500px] bg-[#1e293b] rounded-xl border-4 border-slate-800 shadow-2xl transition-transform duration-200 ease-out origin-top-left">
                <h1 className="absolute top-10 left-1/2 -translate-x-1/2 text-[10rem] font-black text-slate-800/50 tracking-[0.2em] pointer-events-none select-none">PARKING</h1>
                <DraggableZone idKey="p_izq"><div className="flex flex-col">{ZONES.PERIMETRO_IZQ.map(id => <Plaza key={id} id={id} className="h-8 w-16" />)}</div></DraggableZone>
                <DraggableZone idKey="p_arr"><div className="flex">{ZONES.PERIMETRO_ARR.map(id => <Plaza key={id} id={id} className="h-16 w-8" />)}</div></DraggableZone>
                <DraggableZone idKey="p_der"><div className="flex flex-col">{ZONES.PERIMETRO_DER.map(id => <Plaza key={id} id={id} className="h-8 w-16" />)}</div></DraggableZone>
                <DraggableZone idKey="p_abajo_l"><div className="flex">{ZONES.PERIMETRO_ABAJO_L.map(id => <Plaza key={id} id={id} className="h-16 w-8" />)}</div></DraggableZone>
                <DraggableZone idKey="p_abajo_r"><div className="flex">{ZONES.PERIMETRO_ABAJO_R.map(id => <Plaza key={id} id={id} className="h-16 w-8" />)}</div></DraggableZone>

                {/* Entradas */}
                <DraggableZone idKey="entrada_1"><div className="w-24 h-16 border-b-4 border-dashed border-yellow-500/30 flex items-center justify-center text-xs font-bold text-yellow-600 bg-yellow-500/5">ENTRADA 1</div></DraggableZone>
                <DraggableZone idKey="entrada_2"><div className="w-24 h-16 border-b-4 border-dashed border-yellow-500/30 flex items-center justify-center text-xs font-bold text-yellow-600 bg-yellow-500/5">ENTRADA 2</div></DraggableZone>
                <DraggableZone idKey="entrada_3"><div className="w-24 h-16 border-b-4 border-dashed border-yellow-500/30 flex items-center justify-center text-xs font-bold text-yellow-600 bg-yellow-500/5">ENTRADA 3</div></DraggableZone>

                <DraggableZone idKey="isla_rosa">
                    <div className="flex flex-col items-center">
                        <div className="flex self-end transform translate-x-6 mb-1">{ZONES.ISLA_ROSA_COPA.map(id => <Plaza key={id} id={id} className="h-14 w-10" />)}</div>
                        <div className="flex">
                            <div className="flex flex-col">{ZONES.ISLA_ROSA_L.map(id => <Plaza key={id} id={id} className="h-8 w-16" />)}</div>
                            <div className="flex flex-col pt-4">{ZONES.ISLA_ROSA_R.map(id => <Plaza key={id} id={id} className="h-8 w-16" />)}</div>
                        </div>
                        <div className="flex self-end transform translate-x-6 mt-1">{ZONES.ISLA_ROSA_BASE.map(id => <Plaza key={id} id={id} className="h-14 w-10" />)}</div>
                    </div>
                </DraggableZone>
                <DraggableZone idKey="isla_amarilla">
                    <div className="flex">
                        <div className="flex flex-col">{ZONES.ISLA_AMARILLA_L.map(id => <Plaza key={id} id={id} className="h-8 w-16" />)}</div>
                        <div className="flex flex-col mt-16">{ZONES.ISLA_AMARILLA_R.map(id => <Plaza key={id} id={id} className="h-8 w-16" />)}</div>
                    </div>
                </DraggableZone>
                <DraggableZone idKey="isla_derecha">
                    <div className="flex">
                        <div className="flex flex-col">{ZONES.ISLA_DERECHA_L.map(id => <Plaza key={id} id={id} className="h-8 w-16" />)}</div>
                        <div className="flex flex-col mt-6">{ZONES.ISLA_DERECHA_R.map(id => <Plaza key={id} id={id} className="h-8 w-16" />)}</div>
                    </div>
                </DraggableZone>
                <DraggableZone idKey="motos"><div className="w-16 h-24 bg-slate-800/50 border-2 border-slate-700 flex items-center justify-center"><MapPin size={24} className="text-slate-600"/></div></DraggableZone>
            </div>
        </div>

        {!editMode && (
            <div className="hidden md:block w-80 shrink-0 h-screen border-l border-slate-800 z-20 bg-slate-900">
                <ListadoPlazas
                    searchTerm={searchTerm}
                    setSearchTerm={setSearchTerm}
                    filteredPlazas={filteredPlazas}
                    plazas={plazas}
                    onSelect={handleSelectPlaza}
                    listFilter={listFilter}
                    setListFilter={setListFilter}
                    getPaymentStatus={getPaymentStatus}
                />
            </div>
        )}
      </div>

      {selectedPlaza && !editMode && (
        <div
          className="fixed inset-0 bg-black/90 flex items-center justify-center z-[100] p-4 backdrop-blur-sm"
          onClick={() => { saveData(formData); setSelectedPlaza(null); }}
        >
           <div
             className="bg-slate-900 border border-slate-700 w-full max-w-lg rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
             onClick={(e) => e.stopPropagation()}
           >
            <div className="bg-slate-950 p-4 border-b border-slate-800 flex justify-between items-center">
               <div className="flex items-center gap-4">
                 <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight flex items-center gap-2"><span className="text-emerald-500">PLAZA</span> {selectedPlaza}</h2>
                 <div className="flex bg-slate-800 rounded-lg p-1 border border-slate-700">
                    <button onClick={() => setActiveTab('info')} className={`px-3 py-1 md:px-4 md:py-1.5 rounded-md text-xs md:text-sm font-bold transition flex items-center gap-2 ${activeTab === 'info' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}><User size={14}/> Info</button>
                    <button onClick={() => setActiveTab('pagos')} className={`px-3 py-1 md:px-4 md:py-1.5 rounded-md text-xs md:text-sm font-bold transition flex items-center gap-2 ${activeTab === 'pagos' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'}`}><Euro size={14}/> Pagos</button>
                 </div>
               </div>
               <button onClick={() => { saveData(formData); setSelectedPlaza(null); }} className="p-2 hover:bg-slate-800 rounded-full text-slate-400"><X /></button>
            </div>
            <div className="p-6 overflow-y-auto">
              {activeTab === 'info' && (
                <div className="space-y-5">
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

                   {/* IMPROVEMENT 9: Mora months indicator */}
                   {plazas[selectedPlaza]?.estado === 'ocupada' && getPaymentStatus(selectedPlaza).mora && (
                     <div className="bg-red-900/20 border border-red-500/50 p-3 rounded-lg flex items-center gap-2">
                       <AlertTriangle size={16} className="text-red-400 shrink-0"/>
                       <span className="text-red-400 font-bold text-sm">
                         {getMoraMonthsCount(selectedPlaza)} {getMoraMonthsCount(selectedPlaza) === 1 ? 'mes en mora' : 'meses en mora'}
                       </span>
                     </div>
                   )}

                   <div className="space-y-2"><label className="text-xs uppercase font-bold text-slate-500">Cliente</label><input className="w-full bg-slate-950 border border-slate-700 p-3 rounded-lg text-white" placeholder="Nombre completo" value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value})} /></div>
                   <div className="space-y-2"><label className="text-xs uppercase font-bold text-slate-500">Matrícula</label><input className="w-full bg-slate-950 border border-slate-700 p-3 rounded-lg text-white font-mono text-xl uppercase" placeholder="0000 XXX" value={formData.matricula} onChange={e => setFormData({...formData, matricula: e.target.value.toUpperCase()})} /></div>
                   <div className="space-y-2"><label className="text-xs uppercase font-bold text-slate-500">Teléfono</label><input className="w-full bg-slate-950 border border-slate-700 p-3 rounded-lg text-white" placeholder="Teléfono" value={formData.telefono} onChange={e => setFormData({...formData, telefono: e.target.value})} /></div>

                   {/* IMPROVEMENT 5: Fecha de inicio */}
                   <div className="space-y-2">
                     <label className="text-xs uppercase font-bold text-slate-500">Fecha inicio contrato</label>
                     <input
                       type="date"
                       className="w-full bg-slate-950 border border-slate-700 p-3 rounded-lg text-white"
                       value={formData.fechaInicio}
                       onChange={e => setFormData({...formData, fechaInicio: e.target.value})}
                     />
                   </div>

                   {/* IMPROVEMENT 6: Importe mensual */}
                   <div className="space-y-2">
                     <label className="text-xs uppercase font-bold text-slate-500">Importe mensual (€)</label>
                     <input
                       type="text"
                       className="w-full bg-slate-950 border border-slate-700 p-3 rounded-lg text-white"
                       placeholder="Ej: 80"
                       value={formData.importeMensual}
                       onChange={e => setFormData({...formData, importeMensual: e.target.value})}
                     />
                   </div>

                   {/* IMPROVEMENT 7: Notas */}
                   <div className="space-y-2">
                     <label className="text-xs uppercase font-bold text-slate-500">Notas</label>
                     <textarea
                       className="w-full bg-slate-950 border border-slate-700 p-3 rounded-lg text-white resize-none"
                       placeholder="Observaciones..."
                       rows={3}
                       value={formData.notas}
                       onChange={e => setFormData({...formData, notas: e.target.value})}
                     />
                   </div>

                   <div className="pt-6 flex gap-3">
                      {plazas[selectedPlaza]?.estado === 'ocupada' ? (
                        <>
                           {showDeleteConfirm ? (
                             <div className="w-full bg-red-900/20 border border-red-500/50 p-4 rounded-lg flex flex-col gap-3 animate-in fade-in zoom-in-95">
                                <div className="flex items-center gap-2 text-red-400 font-bold justify-center">
                                   <AlertTriangle size={20}/>
                                   <span>¿Estás seguro que deseas eliminar?</span>
                                </div>
                                <div className="flex gap-2">
                                   <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 py-2 bg-slate-800 text-white rounded font-bold hover:bg-slate-700">Cancelar</button>
                                   <button onClick={confirmarLiberacion} className="flex-1 py-2 bg-red-600 text-white rounded font-bold hover:bg-red-700">Sí, Eliminar</button>
                                </div>
                             </div>
                           ) : (
                             <>
                               <button onClick={() => saveData(formData)} className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-lg font-bold flex items-center justify-center gap-2"><Save size={18}/> GUARDAR</button>
                               <button onClick={() => setShowDeleteConfirm(true)} className="px-6 bg-red-900/30 hover:bg-red-900 text-red-300 border border-red-800 py-3 rounded-lg font-bold flex items-center justify-center gap-2"><Trash2 size={18}/> Borrar</button>
                             </>
                           )}
                        </>
                      ) : (
                        <button onClick={() => saveData(formData)} className="w-full bg-emerald-500 text-slate-900 py-4 rounded-lg font-black tracking-wide hover:bg-emerald-400 transition flex justify-center gap-2 items-center shadow-lg shadow-emerald-900/20"><Save size={20} /> ENTRADA</button>
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

                   {plazas[selectedPlaza]?.isBank && getPaymentStatus(selectedPlaza).facturar && (
                       <div className="bg-yellow-900/20 border border-yellow-500/50 p-3 rounded-lg flex items-center justify-between">
                           <div className="flex items-center gap-2 text-yellow-400 font-bold">
                               <AlertTriangle size={18}/>
                               <span>CONFIRMAR PAGO de Impuestos TRIMESTRALES</span>
                           </div>
                           <button onClick={confirmFacturacion} className="bg-yellow-600 text-slate-900 px-3 py-1 rounded-full text-xs font-bold hover:bg-yellow-500 transition-all">CONFIRMAR</button>
                       </div>
                   )}

                   <div className="grid grid-cols-2 gap-3">
                      {MONTHS.map((mes, index) => {
                        const valor = plazas[selectedPlaza]?.pagos?.[selectedYear]?.[mes] || "";

                        let monthClass = 'bg-slate-800 border-slate-700';
                        let facturacionAviso = false;

                        let isCovered = isMonthPaidOrCovered(index, selectedYear, plazas[selectedPlaza]?.pagos || {});

                        // 1. Comprobación de Pago/Cobertura (Verde)
                        if (isCovered) {
                            monthClass = 'bg-emerald-900/20 border-emerald-500/50';
                        }

                        // 2. Comprobación de Mora (Rojo)
                        const isCurrentYear = selectedYear === new Date().getFullYear().toString();
                        const isMonthPastOrPresent = isCurrentYear && MONTHS.indexOf(mes) <= new Date().getMonth();

                        // Si es un mes pasado o presente Y NO está cubierto, es Mora
                        if (isMonthPastOrPresent && !isCovered) {
                            monthClass = 'bg-red-900/20 border-red-500/50';
                        }

                        // 3. Comprobación de Facturación (Amarillo) - ANULA MORA/VERDE
                        const status = getPaymentStatus(selectedPlaza);
                        if (plazas[selectedPlaza]?.isBank && status.facturar && status.monthsToFacturar.includes(mes)) {
                             monthClass = 'bg-yellow-900/20 border-yellow-500/50';
                             facturacionAviso = true;
                        } else if (valor.length > 0 && !monthClass.includes('red')) {
                            // 3. Pagado (verde)
                             monthClass = 'bg-emerald-900/20 border-emerald-500/50';
                        }

                        // Determinar color de texto y círculo
                        const isPaidGreen = valor.length > 0 && !monthClass.includes('red') && !facturacionAviso;

                        return (
                          <div key={mes} className={`p-3 rounded-lg border ${monthClass}`}>
                             <div className="flex justify-between items-center mb-1">
                                <span className={`text-[10px] font-black uppercase ${monthClass.includes('emerald') ? 'text-emerald-400' : monthClass.includes('red') ? 'text-red-400' : monthClass.includes('yellow') ? 'text-yellow-400' : 'text-slate-500'}`}>{mes}</span>
                                {isPaidGreen && <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>}
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
    </div>
  );
}
