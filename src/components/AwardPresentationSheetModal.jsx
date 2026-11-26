import React, { useRef } from 'react';
import {
  X,
  Printer,
  Download,
  Trophy,
  Medal,
  Calendar,
  MapPin,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { generateAwardPresentationSheetPDF } from '../utils/pdfGenerator';

export default function AwardPresentationSheetModal({
  isOpen,
  onClose,
  event,
  gender = 'M',
  tournament = {},
  rankedList = []
}) {
  const printRef = useRef(null);

  if (!isOpen) return null;

  const goldWinner = rankedList[0];
  const silverWinner = rankedList[1];
  const bronzeWinner = rankedList[2];

  const genderLabel = event?.id?.includes('mixto')
    ? 'Mixto'
    : gender === 'F'
    ? 'Femenil (Niñas)'
    : 'Varonil (Niños)';

  const handleDownloadPDF = () => {
    generateAwardPresentationSheetPDF(rankedList, event, tournament, genderLabel);
  };

  const handlePrint = () => {
    window.print();
  };

  const folioCode = `JDE-${(event?.shortName || 'ATLE').toUpperCase()}-2026`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl border border-slate-200 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Barra de Acciones Superior */}
        <div className="bg-slate-50 border-b border-slate-200 px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center shadow-2xs">
              <Trophy className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900">
                Cédula Oficial de Premiación de Podio
              </h3>
              <p className="text-[11px] text-slate-500">
                Formato oficial listo para imprimir o descargar en PDF
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={handleDownloadPDF}
              className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl text-xs font-black flex items-center space-x-1.5 shadow-2xs transition-all active:scale-95"
              title="Descargar cédula oficial de premiación en PDF listo para imprimir"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Descargar PDF</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold flex items-center space-x-1 transition-colors"
              title="Imprimir directamente desde el navegador"
            >
              <Printer className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden sm:inline">Imprimir</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
              title="Cerrar ventana"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Contenedor de la Hoja de Premiación */}
        <div className="p-4 sm:p-7 max-h-[82vh] overflow-y-auto bg-slate-100/60">
          <div
            ref={printRef}
            className="relative bg-white rounded-2xl border-2 border-amber-400/90 shadow-md p-6 sm:p-9 space-y-6"
          >
            {/* Pequeños detalles: Escuadras arquitectónicas en las 4 esquinas (sin imágenes) */}
            <div className="absolute top-2.5 left-2.5 w-3.5 h-3.5 border-t-2 border-l-2 border-amber-600/80 pointer-events-none" />
            <div className="absolute top-2.5 right-2.5 w-3.5 h-3.5 border-t-2 border-r-2 border-amber-600/80 pointer-events-none" />
            <div className="absolute bottom-2.5 left-2.5 w-3.5 h-3.5 border-b-2 border-l-2 border-amber-600/80 pointer-events-none" />
            <div className="absolute bottom-2.5 right-2.5 w-3.5 h-3.5 border-b-2 border-r-2 border-amber-600/80 pointer-events-none" />

            {/* Marco interior fino con sutil separación */}
            <div className="border border-slate-200/90 rounded-xl p-5 sm:p-7 space-y-6 bg-white relative">
              {/* Micro-Detalle Superior: Folio de Certificación Oficial */}
              <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono pb-2 border-b border-slate-100">
                <span className="font-semibold tracking-wider text-slate-500">
                  FOLIO OFICIAL: <span className="text-amber-700 font-bold">{folioCode}</span>
                </span>
                <span className="flex items-center space-x-1 text-emerald-700 font-sans font-bold">
                  <ShieldCheck className="w-3 h-3 text-emerald-600" />
                  <span>CÉDULA CERTIFICADA • VALIDEZ OFICIAL</span>
                </span>
              </div>

              {/* Encabezado Institucional con Emblema Ornamental (Sin imágenes) */}
              <div className="text-center space-y-1.5 pb-2 relative">
                <span className="text-[10px] font-black tracking-widest text-amber-800 uppercase bg-amber-50 px-3.5 py-1 rounded-full border border-amber-200 inline-flex items-center space-x-1.5 mb-1 shadow-2xs">
                  <Sparkles className="w-3 h-3 text-amber-500" />
                  <span>CÉDULA TÉCNICA OFICIAL DE PREMIACIÓN</span>
                  <Sparkles className="w-3 h-3 text-amber-500" />
                </span>

                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight uppercase">
                  {tournament.name || 'Juegos Deportivos Escolares de Atletismo 2026'}
                </h1>

                {/* Pequeño detalle: Divisor clásico con rombo central (Vector / CSS puro) */}
                <div className="flex items-center justify-center space-x-3 py-1">
                  <div className="h-px bg-gradient-to-r from-transparent via-amber-400 to-transparent w-20 sm:w-32" />
                  <span className="text-amber-600 text-xs font-serif select-none">❖</span>
                  <div className="h-px bg-gradient-to-r from-transparent via-amber-400 to-transparent w-20 sm:w-32" />
                </div>

                <p className="text-xs text-slate-600 font-medium">
                  {tournament.organizer || 'Comité Organizador y Supervisión General de Educación Física'}
                </p>

                {/* Metadatos de la Prueba en Pastillas Pastel con Micro-Iconos */}
                <div className="pt-2 flex flex-wrap items-center justify-center gap-2 text-xs mt-1">
                  <span className="bg-rose-50 text-rose-800 border border-rose-200 px-3.5 py-1 rounded-xl font-bold flex items-center space-x-1.5 shadow-2xs">
                    <Trophy className="w-3.5 h-3.5 text-rose-600" />
                    <span>Prueba: {event?.name || 'Prueba Oficial'}</span>
                  </span>
                  <span className="bg-sky-50 text-sky-800 border border-sky-200 px-3 py-1 rounded-xl font-bold shadow-2xs">
                    Rama: {genderLabel}
                  </span>
                  <span className="bg-amber-50 text-amber-900 border border-amber-200 px-3 py-1 rounded-xl font-medium flex items-center space-x-1 shadow-2xs">
                    <Calendar className="w-3 h-3 text-amber-600" />
                    <span>{tournament.date || new Date().toLocaleDateString('es-MX')}</span>
                  </span>
                  <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1 rounded-xl font-medium flex items-center space-x-1 shadow-2xs">
                    <MapPin className="w-3 h-3 text-emerald-600" />
                    <span>{tournament.venue || 'Estadio Escolar'}</span>
                  </span>
                </div>
              </div>

              {/* PODIO DE HONOR (1º, 2º y 3º LUGAR EN 3 COLUMNAS PROTAGÓNICAS) */}
              <div className="space-y-4 pt-1">
                <div className="flex items-center justify-center space-x-2 text-slate-700 font-bold text-xs uppercase tracking-wider">
                  <Medal className="w-4 h-4 text-amber-500" />
                  <span>Podio Oficial de Campeones</span>
                  <Medal className="w-4 h-4 text-amber-500" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-4 items-end">
                  {/* 2º LUGAR (MEDALLA DE PLATA) */}
                  <div className="rounded-2xl border-2 border-slate-300 bg-gradient-to-b from-slate-100/70 to-white p-5 pt-7 text-center shadow-xs flex flex-col justify-between order-2 md:order-1 relative min-h-[265px]">
                    {/* Micro-detalle: Marcadores de esquina finos en la tarjeta */}
                    <div className="absolute top-2.5 left-2.5 text-[9px] font-bold text-slate-400 font-serif">II</div>
                    <div className="absolute top-2.5 right-2.5 text-[9px] font-bold text-slate-400 font-serif">II</div>

                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-slate-200 text-slate-800 text-[10px] font-black uppercase tracking-wider px-3.5 py-0.5 rounded-full shadow-2xs border border-slate-300 whitespace-nowrap">
                      {gender === 'F' && !event?.id?.includes('mixto') ? 'SUB-CAMPEONA' : 'SUB-CAMPEÓN'}
                    </div>
                    <div>
                      {/* Medallón plata circular vectorial */}
                      <div className="w-12 h-12 mx-auto rounded-full bg-gradient-to-br from-slate-200 to-slate-300 border-2 border-slate-300 text-slate-800 font-athletic font-black text-xl flex items-center justify-center shadow-2xs mt-2 mb-3">
                        2º
                      </div>
                      <h4 className="font-bold text-base sm:text-lg text-slate-900 leading-tight">
                        {silverWinner?.fullName || 'Por definir'}
                      </h4>
                      <p className="text-xs text-slate-600 font-medium mt-1">
                        {silverWinner?.schoolName || 'Escuela Primaria'}
                      </p>

                      {/* Micro-detalle: Estilo de dorsal de competencia */}
                      {silverWinner?.bibNumber && (
                        <div className="inline-flex items-center space-x-1.5 mt-2 bg-white px-2.5 py-0.5 rounded border border-slate-200 shadow-2xs">
                          <span className="w-1 h-1 rounded-full bg-slate-300" />
                          <span className="font-mono text-[10px] font-bold text-slate-600">
                            DORSAL #{silverWinner.bibNumber}
                          </span>
                          <span className="w-1 h-1 rounded-full bg-slate-300" />
                        </div>
                      )}
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-200">
                      <div className="flex items-center justify-center space-x-1 text-[9px] uppercase font-bold text-slate-500 tracking-wider">
                        <Clock className="w-2.5 h-2.5 text-slate-400" />
                        <span>Marca Oficial</span>
                      </div>
                      <span className="font-athletic text-2xl font-black text-slate-900 mt-0.5 block">
                        {silverWinner?.markFormatted || '--'}
                      </span>
                      {silverWinner?.tieNote && (
                        <span className="text-[9px] text-slate-600 italic block mt-1">
                          {silverWinner.tieNote}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* 1º LUGAR (MEDALLA DE ORO / CAMPEÓN) - DESTACADO */}
                  <div className="rounded-2xl border-2 border-amber-400 bg-gradient-to-b from-amber-50 via-amber-100/30 to-white p-5 pt-7 text-center shadow-md flex flex-col justify-between order-1 md:order-2 md:-translate-y-2 relative min-h-[285px]">
                    {/* Micro-detalle: Marcadores de esquina dorados */}
                    <div className="absolute top-2.5 left-2.5 text-[10px] font-bold text-amber-500 font-serif">I</div>
                    <div className="absolute top-2.5 right-2.5 text-[10px] font-bold text-amber-500 font-serif">I</div>

                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-amber-500 text-slate-950 text-[11px] font-black uppercase tracking-wider px-4 py-0.5 rounded-full shadow-xs border border-amber-400 whitespace-nowrap">
                      {event?.id?.includes('relevo') ? '1º • CAMPEÓN' : gender === 'F' ? 'CAMPEONA' : 'CAMPEÓN'}
                    </div>
                    <div>
                      {/* Medallón oro circular vectorial */}
                      <div className="w-14 h-14 mx-auto rounded-full bg-gradient-to-br from-amber-300 to-amber-500 border-2 border-amber-400 text-amber-950 font-athletic font-black text-2xl flex items-center justify-center shadow-xs mt-2 mb-3">
                        1º
                      </div>
                      <h4 className="font-black text-lg sm:text-xl text-slate-900 leading-tight">
                        {goldWinner?.fullName || 'Por definir'}
                      </h4>
                      <p className="text-xs sm:text-sm text-slate-600 font-semibold mt-1">
                        {goldWinner?.schoolName || 'Escuela Primaria'}
                      </p>

                      {/* Micro-detalle: Estilo de dorsal de competencia con pin-holes */}
                      {goldWinner?.bibNumber && (
                        <div className="inline-flex items-center space-x-1.5 mt-2 bg-amber-100/80 px-3 py-0.5 rounded border border-amber-300 shadow-2xs">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                          <span className="font-mono text-[11px] font-bold text-amber-950">
                            DORSAL #{goldWinner.bibNumber}
                          </span>
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                        </div>
                      )}
                    </div>

                    <div className="mt-4 pt-3 border-t border-amber-200">
                      <div className="flex items-center justify-center space-x-1 text-[9px] uppercase font-bold text-amber-800 tracking-wider">
                        <CheckCircle2 className="w-2.5 h-2.5 text-amber-600" />
                        <span>Marca Oficial Ratificada</span>
                      </div>
                      <span className="font-athletic text-3xl font-black text-slate-950 mt-0.5 block">
                        {goldWinner?.markFormatted || '--'}
                      </span>
                      {goldWinner?.tieNote && (
                        <span className="text-[9px] text-amber-800 italic block mt-1">
                          {goldWinner.tieNote}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* 3º LUGAR (MEDALLA DE BRONCE) */}
                  <div className="rounded-2xl border-2 border-amber-600/40 bg-gradient-to-b from-amber-50/60 to-white p-5 pt-7 text-center shadow-xs flex flex-col justify-between order-3 relative min-h-[265px]">
                    {/* Micro-detalle: Marcadores de esquina finos en la tarjeta */}
                    <div className="absolute top-2.5 left-2.5 text-[9px] font-bold text-amber-700/60 font-serif">III</div>
                    <div className="absolute top-2.5 right-2.5 text-[9px] font-bold text-amber-700/60 font-serif">III</div>

                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-700 text-amber-50 text-[10px] font-black uppercase tracking-wider px-3.5 py-0.5 rounded-full shadow-2xs border border-amber-600 whitespace-nowrap">
                      TERCER LUGAR
                    </div>
                    <div>
                      {/* Medallón bronce circular vectorial */}
                      <div className="w-12 h-12 mx-auto rounded-full bg-gradient-to-br from-amber-600 to-amber-700 border-2 border-amber-600 text-amber-100 font-athletic font-black text-xl flex items-center justify-center shadow-2xs mt-2 mb-3">
                        3º
                      </div>
                      <h4 className="font-bold text-base sm:text-lg text-slate-900 leading-tight">
                        {bronzeWinner?.fullName || 'Por definir'}
                      </h4>
                      <p className="text-xs text-slate-600 font-medium mt-1">
                        {bronzeWinner?.schoolName || 'Escuela Primaria'}
                      </p>

                      {/* Micro-detalle: Estilo de dorsal de competencia */}
                      {bronzeWinner?.bibNumber && (
                        <div className="inline-flex items-center space-x-1.5 mt-2 bg-white px-2.5 py-0.5 rounded border border-amber-200 shadow-2xs">
                          <span className="w-1 h-1 rounded-full bg-amber-300" />
                          <span className="font-mono text-[10px] font-bold text-amber-900">
                            DORSAL #{bronzeWinner.bibNumber}
                          </span>
                          <span className="w-1 h-1 rounded-full bg-amber-300" />
                        </div>
                      )}
                    </div>

                    <div className="mt-4 pt-3 border-t border-amber-200/80">
                      <div className="flex items-center justify-center space-x-1 text-[9px] uppercase font-bold text-amber-800 tracking-wider">
                        <Clock className="w-2.5 h-2.5 text-amber-600" />
                        <span>Marca Oficial</span>
                      </div>
                      <span className="font-athletic text-2xl font-black text-slate-900 mt-0.5 block">
                        {bronzeWinner?.markFormatted || '--'}
                      </span>
                      {bronzeWinner?.tieNote && (
                        <span className="text-[9px] text-amber-800 italic block mt-1">
                          {bronzeWinner.tieNote}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* PIE DE FIRMAS REGLAMENTARIAS Y NOTA TÉCNICA (SIN SELLO) */}
              <div className="pt-6 border-t border-slate-200 space-y-4">
                <div className="grid grid-cols-2 gap-12 text-center text-xs">
                  <div>
                    <div className="border-t border-slate-400 w-52 sm:w-64 mx-auto pt-2">
                      <p className="font-bold text-slate-800 text-xs">
                        Coordinador General de Educación Física
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5">Supervisión Escolar Oficial</p>
                    </div>
                  </div>

                  <div>
                    <div className="border-t border-slate-400 w-52 sm:w-64 mx-auto pt-2">
                      <p className="font-bold text-slate-800 text-xs">
                        Juez Árbitro Oficial de Atletismo
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5">Colegio de Jueces y Cronometraje</p>
                    </div>
                  </div>
                </div>

                {/* Micro-detalle inferior: Clave de homologación técnica */}
                <div className="text-center pt-2 border-t border-slate-100">
                  <p className="text-[9px] text-slate-400 tracking-wider uppercase font-mono">
                    LINEAMIENTOS TÉCNICOS OFICIALES CONDEBA / FMAA • REGISTRO Y CRONOMETRAJE ELECTRÓNICO OFICIAL
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}