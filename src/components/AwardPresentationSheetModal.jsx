import React, { useRef } from 'react';
import {
  X,
  Printer,
  Download,
  Trophy,
  Medal,
  Award,
  Sparkles,
  Calendar,
  MapPin,
  CheckCircle2,
  Share2
} from 'lucide-react';
import awardBgImage from '../assets/award_presentation_bg.jpg';
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/70 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-4xl w-full shadow-2xl border border-slate-200 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Barra de Acciones Superior */}
        <div className="bg-slate-50 border-b border-slate-200 px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center">
              <Trophy className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900">
                Hoja Oficial de Premiación de Lugares
              </h3>
              <p className="text-[11px] text-slate-500">
                Presentación oficial de podio y ganadores con diseño estético
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={handleDownloadPDF}
              className="px-3.5 py-1.5 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-2xs transition-all active:scale-95"
              title="Descargar hoja oficial de premiación en PDF listo para imprimir"
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
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/80 rounded-xl transition-colors"
              title="Cerrar ventana"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Contenedor de la Hoja de Premiación (Renderizado Estético y Elegante) */}
        <div className="p-4 sm:p-7 max-h-[82vh] overflow-y-auto bg-slate-100/70">
          <div
            ref={printRef}
            className="relative bg-white rounded-2xl border-2 border-amber-300/80 shadow-md p-6 sm:p-8 space-y-6 overflow-hidden"
            style={{
              backgroundImage: `linear-gradient(rgba(255, 255, 255, 0.94), rgba(255, 255, 255, 0.94)), url(${awardBgImage})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            }}
          >
            {/* Marco interior ceremonial sutil */}
            <div className="border border-slate-300/70 rounded-xl p-5 sm:p-6 space-y-6 bg-white/70 backdrop-blur-2xs">
              {/* Encabezado Institucional y Deportivo */}
              <div className="text-center space-y-1.5 pb-4 border-b border-slate-200/80 relative">
                <span className="text-[10px] font-black tracking-widest text-amber-700 uppercase bg-amber-50 px-3 py-1 rounded-full border border-amber-200 inline-block mb-1">
                  ★ CÉDULA OFICIAL DE PREMIACIÓN Y PODIO DE HONOR ★
                </span>
                <h1 className="text-lg sm:text-2xl font-black text-slate-900 tracking-tight font-athletic uppercase">
                  {tournament.name || 'Juegos Deportivos Escolares de Atletismo 2026'}
                </h1>
                <p className="text-xs text-slate-600 font-medium">
                  {tournament.organizer || 'Comité Organizador y Supervisión de Educación Física Escolar'}
                </p>

                {/* Metadatos de la Prueba en Pastillas Pastel */}
                <div className="pt-2 flex flex-wrap items-center justify-center gap-2 text-xs">
                  <span className="bg-rose-50 text-rose-800 border border-rose-200 px-3 py-1 rounded-xl font-bold flex items-center space-x-1">
                    <Trophy className="w-3.5 h-3.5 text-rose-600" />
                    <span>Prueba: {event?.name || 'Prueba Oficial'}</span>
                  </span>
                  <span className="bg-sky-50 text-sky-800 border border-sky-200 px-3 py-1 rounded-xl font-bold">
                    Rama: {genderLabel}
                  </span>
                  <span className="bg-slate-100 text-slate-700 border border-slate-200 px-3 py-1 rounded-xl font-medium flex items-center space-x-1">
                    <Calendar className="w-3 h-3 text-slate-500" />
                    <span>{tournament.date || new Date().toLocaleDateString('es-MX')}</span>
                  </span>
                  <span className="bg-slate-100 text-slate-700 border border-slate-200 px-3 py-1 rounded-xl font-medium flex items-center space-x-1">
                    <MapPin className="w-3 h-3 text-slate-500" />
                    <span>{tournament.venue || 'Estadio Escolar'}</span>
                  </span>
                </div>
              </div>

              {/* PODIO DE HONOR (1º, 2º y 3º LUGAR EN 3 COLUMNAS DESTACADAS) */}
              <div className="space-y-2">
                <div className="flex items-center justify-center space-x-2 text-slate-700 font-bold text-xs uppercase tracking-wider">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>Podio de Ganadores Oficiales</span>
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 pt-1">
                  {/* 1º LUGAR (MEDALLA DE ORO) */}
                  <div className="rounded-2xl border-2 border-amber-300 bg-gradient-to-b from-amber-50/80 to-amber-100/40 p-4 text-center shadow-xs flex flex-col justify-between relative order-1 md:order-2 md:-translate-y-1">
                    <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-amber-500 text-slate-950 text-[10px] font-black uppercase tracking-wider px-3 py-0.5 rounded-full shadow-2xs border border-amber-400">
                      CAMPEÓN
                    </div>
                    <div>
                      <div className="w-12 h-12 mx-auto rounded-full bg-amber-400 border-2 border-amber-300 text-amber-950 font-athletic font-black text-xl flex items-center justify-center shadow-xs mt-1 mb-2">
                        🥇 1º
                      </div>
                      <h4 className="font-black text-sm sm:text-base text-slate-900">
                        {goldWinner?.fullName || 'Por definir'}
                      </h4>
                      <p className="text-xs text-slate-600 font-medium">
                        {goldWinner?.schoolName || 'Escuela Primaria'}
                      </p>
                      {goldWinner?.bibNumber && (
                        <span className="inline-block mt-1 font-mono text-[10px] font-bold text-slate-500 bg-white/80 px-2 py-0.5 rounded-md border border-slate-200">
                          Dorsal #{goldWinner.bibNumber}
                        </span>
                      )}
                    </div>
                    <div className="mt-3 pt-2 border-t border-amber-200">
                      <span className="text-[10px] uppercase font-bold text-amber-800 block">Marca Oficial:</span>
                      <span className="font-athletic text-2xl font-black text-slate-900">
                        {goldWinner?.markFormatted || '--'}
                      </span>
                      {goldWinner?.tieNote && (
                        <span className="text-[9px] text-amber-800 italic block mt-0.5">
                          {goldWinner.tieNote}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* 2º LUGAR (MEDALLA DE PLATA) */}
                  <div className="rounded-2xl border-2 border-slate-300 bg-gradient-to-b from-slate-50/90 to-slate-100/40 p-4 text-center shadow-xs flex flex-col justify-between order-2 md:order-1">
                    <div className="text-[10px] font-black text-slate-600 uppercase tracking-wider mb-1">
                      SUB-CAMPEÓN
                    </div>
                    <div>
                      <div className="w-11 h-11 mx-auto rounded-full bg-slate-200 border-2 border-slate-300 text-slate-800 font-athletic font-black text-lg flex items-center justify-center shadow-xs mb-2">
                        🥈 2º
                      </div>
                      <h4 className="font-bold text-sm text-slate-900">
                        {silverWinner?.fullName || 'Por definir'}
                      </h4>
                      <p className="text-xs text-slate-600 font-medium">
                        {silverWinner?.schoolName || 'Escuela Primaria'}
                      </p>
                      {silverWinner?.bibNumber && (
                        <span className="inline-block mt-1 font-mono text-[10px] font-bold text-slate-500 bg-white/80 px-2 py-0.5 rounded-md border border-slate-200">
                          Dorsal #{silverWinner.bibNumber}
                        </span>
                      )}
                    </div>
                    <div className="mt-3 pt-2 border-t border-slate-200">
                      <span className="text-[10px] uppercase font-bold text-slate-600 block">Marca Oficial:</span>
                      <span className="font-athletic text-xl font-black text-slate-900">
                        {silverWinner?.markFormatted || '--'}
                      </span>
                      {silverWinner?.tieNote && (
                        <span className="text-[9px] text-slate-600 italic block mt-0.5">
                          {silverWinner.tieNote}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* 3º LUGAR (MEDALLA DE BRONCE) */}
                  <div className="rounded-2xl border-2 border-amber-300/70 bg-gradient-to-b from-amber-50/50 to-orange-50/40 p-4 text-center shadow-xs flex flex-col justify-between order-3">
                    <div className="text-[10px] font-black text-amber-800 uppercase tracking-wider mb-1">
                      TERCER LUGAR
                    </div>
                    <div>
                      <div className="w-11 h-11 mx-auto rounded-full bg-amber-600 border-2 border-amber-700 text-amber-100 font-athletic font-black text-lg flex items-center justify-center shadow-xs mb-2">
                        🥉 3º
                      </div>
                      <h4 className="font-bold text-sm text-slate-900">
                        {bronzeWinner?.fullName || 'Por definir'}
                      </h4>
                      <p className="text-xs text-slate-600 font-medium">
                        {bronzeWinner?.schoolName || 'Escuela Primaria'}
                      </p>
                      {bronzeWinner?.bibNumber && (
                        <span className="inline-block mt-1 font-mono text-[10px] font-bold text-slate-500 bg-white/80 px-2 py-0.5 rounded-md border border-slate-200">
                          Dorsal #{bronzeWinner.bibNumber}
                        </span>
                      )}
                    </div>
                    <div className="mt-3 pt-2 border-t border-amber-200/80">
                      <span className="text-[10px] uppercase font-bold text-amber-800 block">Marca Oficial:</span>
                      <span className="font-athletic text-xl font-black text-slate-900">
                        {bronzeWinner?.markFormatted || '--'}
                      </span>
                      {bronzeWinner?.tieNote && (
                        <span className="text-[9px] text-amber-800 italic block mt-0.5">
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
                  <div className="flex items-center space-x-1.5 text-slate-700 font-bold text-xs uppercase tracking-wider">
                    <Award className="w-3.5 h-3.5 text-slate-500" />
                    <span>Cuadro de Finalistas Oficiales</span>
                  </div>
                  <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white/90">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50/90 text-slate-700 font-bold uppercase text-[10px] border-b border-slate-200">
                        <tr>
                          <th className="py-2 px-3 text-center w-14">Lugar</th>
                          <th className="py-2 px-3 text-center w-16">Dorsal</th>
                          <th className="py-2 px-3">Nombre del Alumno</th>
                          <th className="py-2 px-3">Escuela Primaria</th>
                          <th className="py-2 px-3 text-center">Marca Oficial</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700">
                        {otherFinalists.map((fin) => (
                          <tr key={fin.id} className="hover:bg-slate-50/50">
                            <td className="py-1.5 px-3 text-center font-bold font-athletic text-sm text-slate-800">
                              {fin.rank ? `${fin.rank}º` : '-'}
                            </td>
                            <td className="py-1.5 px-3 text-center font-mono text-[11px] font-bold text-slate-600">
                              #{fin.bibNumber || 'S/N'}
                            </td>
                            <td className="py-1.5 px-3 font-semibold text-slate-900">
                              {fin.fullName}
                            </td>
                            <td className="py-1.5 px-3 text-slate-600">
                              {fin.schoolName}
                            </td>
                            <td className="py-1.5 px-3 text-center font-athletic font-bold text-slate-900">
                              {fin.markFormatted || '--'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* PIE DE FIRMAS REGLAMENTARIAS */}
              <div className="pt-6 border-t border-slate-200/80 grid grid-cols-2 gap-8 text-center text-xs">
                <div>
                  <div className="border-t border-slate-400/80 w-44 sm:w-56 mx-auto pt-1.5">
                    <p className="font-bold text-slate-800 text-[11px]">
                      Coordinador de Educación Física
                    </p>
                    <p className="text-[10px] text-slate-500">Supervisión Escolar Oficial</p>
                  </div>
                </div>

                <div>
                  <div className="border-t border-slate-400/80 w-44 sm:w-56 mx-auto pt-1.5">
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
