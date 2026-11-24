import React, { useRef } from 'react';
import {
  X,
  Printer,
  Download,
  Trophy,
  Medal,
  Calendar,
  MapPin,
  Sparkles
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
                Presentación de honor oficial • 1º, 2º y 3º Lugar
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
            className="bg-white rounded-2xl border-2 border-amber-300/80 shadow-md p-6 sm:p-9 space-y-7"
          >
            {/* Marco interior fino institucional con sutil toque dorado */}
            <div className="border border-slate-200/90 rounded-xl p-5 sm:p-7 space-y-7 bg-white relative">
              {/* Encabezado Institucional y Deportivo con Color y Elegancia */}
              <div className="text-center space-y-1.5 pb-4 border-b border-slate-200/80 relative">
                <span className="text-[10px] font-black tracking-widest text-amber-700 uppercase bg-amber-50 px-3 py-1 rounded-full border border-amber-200 inline-flex items-center space-x-1.5 mb-1 shadow-2xs">
                  <Sparkles className="w-3 h-3 text-amber-500" />
                  <span>CÉDULA OFICIAL DE PREMIACIÓN Y PODIO DE HONOR</span>
                  <Sparkles className="w-3 h-3 text-amber-500" />
                </span>
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight uppercase">
                  {tournament.name || 'Juegos Deportivos Escolares de Atletismo 2026'}
                </h1>
                <p className="text-xs text-slate-600 font-medium">
                  {tournament.organizer || 'Comité Organizador y Supervisión General de Educación Física'}
                </p>

                {/* Metadatos de la Prueba en Pastillas Pastel Coloridas */}
                <div className="pt-2 flex flex-wrap items-center justify-center gap-2 text-xs mt-2">
                  <span className="bg-rose-50 text-rose-800 border border-rose-200 px-3.5 py-1 rounded-xl font-bold flex items-center space-x-1 shadow-2xs">
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

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-2 items-end">
                  {/* 2º LUGAR (MEDALLA DE PLATA) */}
                  <div className="rounded-2xl border-2 border-slate-300 bg-gradient-to-b from-slate-100/70 to-white p-5 text-center shadow-xs flex flex-col justify-between order-2 md:order-1 relative min-h-[260px]">
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-slate-200 text-slate-800 text-[10px] font-black uppercase tracking-wider px-3.5 py-0.5 rounded-full shadow-2xs border border-slate-300">
                      SUB-CAMPEÓN
                    </div>
                    <div>
                      <div className="w-12 h-12 mx-auto rounded-full bg-gradient-to-br from-slate-200 to-slate-300 border-2 border-slate-300 text-slate-800 font-athletic font-black text-xl flex items-center justify-center shadow-2xs mt-2 mb-3">
                        🥈 2º
                      </div>
                      <h4 className="font-bold text-base sm:text-lg text-slate-900">
                        {silverWinner?.fullName || 'Por definir'}
                      </h4>
                      <p className="text-xs text-slate-600 font-medium mt-1">
                        {silverWinner?.schoolName || 'Escuela Primaria'}
                      </p>
                      {silverWinner?.bibNumber && (
                        <span className="inline-block mt-2 font-mono text-[11px] font-bold text-slate-600 bg-white px-2.5 py-0.5 rounded-md border border-slate-200 shadow-2xs">
                          Dorsal #{silverWinner.bibNumber}
                        </span>
                      )}
                    </div>
                    <div className="mt-4 pt-3 border-t border-slate-200">
                      <span className="text-[10px] uppercase font-bold text-slate-500 block tracking-wider">Marca Oficial:</span>
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

                  {/* 1º LUGAR (MEDALLA DE ORO / CAMPEÓN) - MÁS DESTACADO */}
                  <div className="rounded-2xl border-2 border-amber-400 bg-gradient-to-b from-amber-50 via-amber-100/30 to-white p-5 text-center shadow-md flex flex-col justify-between order-1 md:order-2 md:-translate-y-2 relative min-h-[280px]">
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-amber-500 text-slate-950 text-[11px] font-black uppercase tracking-wider px-4 py-0.5 rounded-full shadow-xs border border-amber-400">
                      ★ CAMPEÓN ★
                    </div>
                    <div>
                      <div className="w-14 h-14 mx-auto rounded-full bg-gradient-to-br from-amber-300 to-amber-500 border-2 border-amber-400 text-amber-950 font-athletic font-black text-2xl flex items-center justify-center shadow-xs mt-2 mb-3">
                        🥇 1º
                      </div>
                      <h4 className="font-black text-lg sm:text-xl text-slate-900">
                        {goldWinner?.fullName || 'Por definir'}
                      </h4>
                      <p className="text-xs sm:text-sm text-slate-600 font-semibold mt-1">
                        {goldWinner?.schoolName || 'Escuela Primaria'}
                      </p>
                      {goldWinner?.bibNumber && (
                        <span className="inline-block mt-2 font-mono text-[11px] font-bold text-amber-950 bg-amber-100/80 px-3 py-0.5 rounded-md border border-amber-300 shadow-2xs">
                          Dorsal #{goldWinner.bibNumber}
                        </span>
                      )}
                    </div>
                    <div className="mt-4 pt-3 border-t border-amber-200">
                      <span className="text-[10px] uppercase font-bold text-amber-800 block tracking-wider">Marca Oficial:</span>
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
                  <div className="rounded-2xl border-2 border-amber-600/40 bg-gradient-to-b from-amber-50/60 to-white p-5 text-center shadow-xs flex flex-col justify-between order-3 relative min-h-[260px]">
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-700 text-amber-50 text-[10px] font-black uppercase tracking-wider px-3.5 py-0.5 rounded-full shadow-2xs border border-amber-600">
                      TERCER LUGAR
                    </div>
                    <div>
                      <div className="w-12 h-12 mx-auto rounded-full bg-gradient-to-br from-amber-600 to-amber-700 border-2 border-amber-600 text-amber-100 font-athletic font-black text-xl flex items-center justify-center shadow-2xs mt-2 mb-3">
                        🥉 3º
                      </div>
                      <h4 className="font-bold text-base sm:text-lg text-slate-900">
                        {bronzeWinner?.fullName || 'Por definir'}
                      </h4>
                      <p className="text-xs text-slate-600 font-medium mt-1">
                        {bronzeWinner?.schoolName || 'Escuela Primaria'}
                      </p>
                      {bronzeWinner?.bibNumber && (
                        <span className="inline-block mt-2 font-mono text-[11px] font-bold text-amber-900 bg-white px-2.5 py-0.5 rounded-md border border-amber-200 shadow-2xs">
                          Dorsal #{bronzeWinner.bibNumber}
                        </span>
                      )}
                    </div>
                    <div className="mt-4 pt-3 border-t border-amber-200/80">
                      <span className="text-[10px] uppercase font-bold text-amber-800 block tracking-wider">Marca Oficial:</span>
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

              {/* PIE DE FIRMAS REGLAMENTARIAS (SIN SELLO, SIMÉTRICAS Y AMPLIAS) */}
              <div className="pt-8 border-t border-slate-200 grid grid-cols-2 gap-12 text-center text-xs">
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
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}