import React, { useRef } from 'react';
import {
  X,
  Printer,
  Download,
  Trophy,
  Award,
  Calendar,
  MapPin
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
  const otherFinalists = rankedList.slice(3, 8); // 4º al 8º lugar

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
            <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 text-slate-700 flex items-center justify-center shadow-2xs">
              <Trophy className="w-4 h-4 text-amber-600" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900">
                Cédula Oficial de Premiación de Lugares
              </h3>
              <p className="text-[11px] text-slate-500">
                Formato técnico oficial minimalista • Ahorro de tinta (Ink-Friendly)
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={handleDownloadPDF}
              className="px-3.5 py-1.5 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-2xs transition-all active:scale-95"
              title="Descargar cédula oficial de premiación en PDF listo para imprimir"
            >
              <Download className="w-3.5 h-3.5 text-amber-400" />
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

        {/* Contenedor de la Hoja de Premiación (Diseño Minimalista, Limpio y de Ahorro de Tinta) */}
        <div className="p-4 sm:p-7 max-h-[82vh] overflow-y-auto bg-slate-100/50">
          <div
            ref={printRef}
            className="bg-white rounded-xl border border-slate-300 shadow-sm p-6 sm:p-8 space-y-6"
          >
            {/* Marco interior fino institucional */}
            <div className="border border-slate-200 rounded-lg p-5 sm:p-7 space-y-6 bg-white">
              {/* Encabezado Institucional y Deportivo */}
              <div className="text-center space-y-1.5 pb-4 border-b border-slate-200">
                <span className="text-[10px] font-bold tracking-widest text-slate-500 uppercase block">
                  SUPERVISIÓN GENERAL DE EDUCACIÓN FÍSICA  •  COMITÉ ORGANIZADOR
                </span>
                <h1 className="text-lg sm:text-2xl font-black text-slate-900 tracking-tight uppercase">
                  {tournament.name || 'Juegos Deportivos Escolares de Atletismo 2026'}
                </h1>
                <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                  Cédula Oficial de Premiación y Podio de Honor
                </p>

                {/* Metadatos de la Prueba en Línea Limpia */}
                <div className="pt-2 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs border-t border-slate-100 mt-3 pt-3 text-slate-700">
                  <div className="text-left">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Prueba Oficial</span>
                    <span className="font-bold text-slate-900">{event?.name || 'Prueba Oficial'}</span>
                  </div>
                  <div className="text-left">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Rama</span>
                    <span className="font-bold text-slate-900">{genderLabel}</span>
                  </div>
                  <div className="text-left">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Fecha</span>
                    <span className="font-medium text-slate-800">{tournament.date || new Date().toLocaleDateString('es-MX')}</span>
                  </div>
                  <div className="text-left">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Sede</span>
                    <span className="font-medium text-slate-800">{tournament.venue || 'Estadio Escolar'}</span>
                  </div>
                </div>
              </div>

              {/* PODIO DE HONOR (1º, 2º y 3º LUGAR EN 3 COLUMNAS LIMPIAS) */}
              <div className="space-y-3">
                <div className="text-center">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                    Cuadro de Honor • Podio Oficial
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
                  {/* 2º LUGAR (MEDALLA DE PLATA) */}
                  <div className="rounded-xl border border-slate-200 bg-white p-4 text-center shadow-2xs flex flex-col justify-between order-2 md:order-1 border-t-2 border-t-slate-400">
                    <div>
                      <div className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full border border-slate-200 text-slate-700 text-[10px] font-bold mb-2">
                        <span>🥈 2º LUGAR</span>
                        <span className="text-slate-400">•</span>
                        <span>PLATA</span>
                      </div>
                      <h4 className="font-bold text-sm sm:text-base text-slate-900 mt-1">
                        {silverWinner?.fullName || 'Por definir'}
                      </h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {silverWinner?.schoolName || 'Escuela Primaria'}
                      </p>
                      {silverWinner?.bibNumber && (
                        <span className="inline-block mt-1 font-mono text-[10px] font-semibold text-slate-600 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                          Dorsal #{silverWinner.bibNumber}
                        </span>
                      )}
                    </div>
                    <div className="mt-3 pt-2.5 border-t border-slate-100">
                      <span className="text-[9px] uppercase font-bold text-slate-400 block tracking-wider">Marca Oficial:</span>
                      <span className="font-mono text-xl font-bold text-slate-900">
                        {silverWinner?.markFormatted || '--'}
                      </span>
                      {silverWinner?.tieNote && (
                        <span className="text-[9px] text-slate-500 italic block mt-0.5">
                          {silverWinner.tieNote}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* 1º LUGAR (MEDALLA DE ORO / CAMPEÓN) */}
                  <div className="rounded-xl border border-slate-300 bg-white p-4 text-center shadow-xs flex flex-col justify-between order-1 md:order-2 border-t-2 border-t-amber-500 md:-translate-y-1">
                    <div>
                      <div className="inline-flex items-center space-x-1 px-3 py-0.5 rounded-full border border-amber-300 text-amber-800 bg-amber-50/50 text-[10px] font-black mb-2">
                        <span>🥇 1º LUGAR</span>
                        <span className="text-amber-400">•</span>
                        <span>CAMPEÓN (ORO)</span>
                      </div>
                      <h4 className="font-black text-base sm:text-lg text-slate-900 mt-1">
                        {goldWinner?.fullName || 'Por definir'}
                      </h4>
                      <p className="text-xs font-medium text-slate-600 mt-0.5">
                        {goldWinner?.schoolName || 'Escuela Primaria'}
                      </p>
                      {goldWinner?.bibNumber && (
                        <span className="inline-block mt-1 font-mono text-[10px] font-bold text-amber-900 bg-amber-50 px-2.5 py-0.5 rounded border border-amber-200">
                          Dorsal #{goldWinner.bibNumber}
                        </span>
                      )}
                    </div>
                    <div className="mt-3 pt-2.5 border-t border-slate-100">
                      <span className="text-[9px] uppercase font-bold text-amber-800 block tracking-wider">Marca Oficial:</span>
                      <span className="font-mono text-2xl font-black text-slate-900">
                        {goldWinner?.markFormatted || '--'}
                      </span>
                      {goldWinner?.tieNote && (
                        <span className="text-[9px] text-amber-700 italic block mt-0.5">
                          {goldWinner.tieNote}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* 3º LUGAR (MEDALLA DE BRONCE) */}
                  <div className="rounded-xl border border-slate-200 bg-white p-4 text-center shadow-2xs flex flex-col justify-between order-3 border-t-2 border-t-amber-700/60">
                    <div>
                      <div className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full border border-amber-200 text-amber-900 text-[10px] font-bold mb-2">
                        <span>🥉 3º LUGAR</span>
                        <span className="text-amber-400">•</span>
                        <span>BRONCE</span>
                      </div>
                      <h4 className="font-bold text-sm sm:text-base text-slate-900 mt-1">
                        {bronzeWinner?.fullName || 'Por definir'}
                      </h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {bronzeWinner?.schoolName || 'Escuela Primaria'}
                      </p>
                      {bronzeWinner?.bibNumber && (
                        <span className="inline-block mt-1 font-mono text-[10px] font-semibold text-slate-600 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                          Dorsal #{bronzeWinner.bibNumber}
                        </span>
                      )}
                    </div>
                    <div className="mt-3 pt-2.5 border-t border-slate-100">
                      <span className="text-[9px] uppercase font-bold text-slate-400 block tracking-wider">Marca Oficial:</span>
                      <span className="font-mono text-xl font-bold text-slate-900">
                        {bronzeWinner?.markFormatted || '--'}
                      </span>
                      {bronzeWinner?.tieNote && (
                        <span className="text-[9px] text-slate-500 italic block mt-0.5">
                          {bronzeWinner.tieNote}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* TABLA DE FINALISTAS Y RESTO DE LUGARES (4º AL 8º) */}
              {otherFinalists.length > 0 && (
                <div className="space-y-1.5 pt-2">
                  <div className="flex items-center space-x-1.5 text-slate-600 font-bold text-xs uppercase tracking-wider">
                    <Award className="w-3.5 h-3.5 text-slate-400" />
                    <span>Cuadro Complementario de Finalistas (4º al 8º Lugar)</span>
                  </div>
                  <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-600 font-bold uppercase text-[10px] border-b border-slate-200">
                        <tr>
                          <th className="py-2 px-3 text-center w-14">Lugar</th>
                          <th className="py-2 px-3 text-center w-16">Dorsal</th>
                          <th className="py-2 px-3">Nombre del Atleta</th>
                          <th className="py-2 px-3">Escuela Primaria</th>
                          <th className="py-2 px-3 text-center">Marca Oficial</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700">
                        {otherFinalists.map((fin) => (
                          <tr key={fin.id} className="hover:bg-slate-50/50">
                            <td className="py-2 px-3 text-center font-bold text-slate-800">
                              {fin.rank ? `${fin.rank}º` : '-'}
                            </td>
                            <td className="py-2 px-3 text-center font-mono text-[11px] font-semibold text-slate-600">
                              #{fin.bibNumber || 'S/N'}
                            </td>
                            <td className="py-2 px-3 font-semibold text-slate-900">
                              {fin.fullName}
                            </td>
                            <td className="py-2 px-3 text-slate-600">
                              {fin.schoolName}
                            </td>
                            <td className="py-2 px-3 text-center font-mono font-bold text-slate-900">
                              {fin.markFormatted || '--'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* PIE DE FIRMAS REGLAMENTARIAS Y SELLO */}
              <div className="pt-6 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-6 items-end text-center text-xs">
                <div>
                  <div className="border-t border-slate-400 w-44 sm:w-48 mx-auto pt-1.5">
                    <p className="font-bold text-slate-800 text-[11px]">
                      Coordinador de Educación Física
                    </p>
                    <p className="text-[10px] text-slate-500">Supervisión Escolar Oficial</p>
                  </div>
                </div>

                <div className="flex justify-center order-first sm:order-none">
                  <div className="w-24 h-16 border border-dashed border-slate-300 rounded-lg flex flex-col items-center justify-center p-1 text-[9px] text-slate-400 uppercase tracking-widest">
                    <span>Sello</span>
                    <span>Oficial</span>
                  </div>
                </div>

                <div>
                  <div className="border-t border-slate-400 w-44 sm:w-48 mx-auto pt-1.5">
                    <p className="font-bold text-slate-800 text-[11px]">
                      Juez Árbitro Oficial de Atletismo
                    </p>
                    <p className="text-[10px] text-slate-500">Colegio de Jueces y Cronometraje</p>
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