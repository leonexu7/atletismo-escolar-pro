import React, { useState } from 'react';
import { Users, X, Check, AlertCircle, Shield } from 'lucide-react';
import { OFFICIAL_EVENTS } from '../constants/events';

export default function RelayBuilderModal({
  isOpen,
  onClose,
  school,
  availableAthletes = [],
  existingRelays = [],
  onSaveRelay
}) {
  const [selectedEventId, setSelectedEventId] = useState('relevo_4x75m_mixto');
  const [members, setMembers] = useState({
    pos1: '',
    pos2: '',
    pos3: '',
    pos4: '',
    alternate: ''
  });
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const relayEvents = OFFICIAL_EVENTS.filter(e => e.type === 'relevo');
  const activeEvent = relayEvents.find(e => e.id === selectedEventId) || relayEvents[0];

  const schoolAthletes = availableAthletes.filter(a => a.schoolId === school?.id);

  const handleMemberChange = (pos, athleteId) => {
    setMembers(prev => ({
      ...prev,
      [pos]: athleteId
    }));
    setErrorMsg('');
  };

  const handleSave = () => {
    if (!members.pos1 || !members.pos2 || !members.pos3 || !members.pos4) {
      setErrorMsg('Debes asignar los 4 corredores titulares.');
      return;
    }

    const titulares = [members.pos1, members.pos2, members.pos3, members.pos4];
    const uniqueTitulares = new Set(titulares);
    if (uniqueTitulares.size < 4) {
      setErrorMsg('No puedes repetir el mismo alumno en distintas postas.');
      return;
    }

    if (activeEvent.id === 'relevo_4x75m_mixto') {
      const p1 = schoolAthletes.find(a => a.id === members.pos1);
      const p2 = schoolAthletes.find(a => a.id === members.pos2);
      const p3 = schoolAthletes.find(a => a.id === members.pos3);
      const p4 = schoolAthletes.find(a => a.id === members.pos4);

      const mCount = [p1, p2, p3, p4].filter(a => a?.gender === 'M').length;
      const fCount = [p1, p2, p3, p4].filter(a => a?.gender === 'F').length;

      if (mCount !== 2 || fCount !== 2) {
        setErrorMsg('El Relevo Mixto exige exactamente 2 varones y 2 mujeres.');
        return;
      }
    }

    const relayTeam = {
      id: `relay-${Date.now()}`,
      schoolId: school.id,
      schoolName: school.name,
      eventId: activeEvent.id,
      eventName: activeEvent.name,
      members: [members.pos1, members.pos2, members.pos3, members.pos4],
      alternate: members.alternate || null
    };

    onSaveRelay(relayTeam);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col">
        {/* Cabecera */}
        <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between border-b-2 border-sky-400">
          <div className="flex items-center space-x-2">
            <Users className="w-5 h-5 text-sky-400" />
            <div>
              <h3 className="font-bold text-sm">Armar Equipo de Relevos</h3>
              <p className="text-[11px] text-slate-300">{school?.name || 'Escuela'}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-3.5">
          {/* Modalidad de Relevo */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Modalidad de Relevo:
            </label>
            <div className="grid grid-cols-3 gap-2">
              {relayEvents.map(ev => (
                <button
                  key={ev.id}
                  onClick={() => {
                    setSelectedEventId(ev.id);
                    setErrorMsg('');
                  }}
                  className={`p-2 rounded-xl border text-xs font-semibold transition-all ${
                    selectedEventId === ev.id
                      ? 'bg-sky-500 border-sky-600 text-white shadow-xs font-bold'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {ev.shortName}
                </button>
              ))}
            </div>
          </div>

          {activeEvent.id === 'relevo_4x75m_mixto' && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-2.5 text-xs text-amber-800 flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <span>
                <strong>Regla Oficial Mixta:</strong> Requiere 2 varones y 2 mujeres en orden alternado.
              </span>
            </div>
          )}

          {/* Selección de las 4 Postas */}
          <div className="space-y-2">
            {[1, 2, 3, 4].map(posNum => {
              const posKey = `pos${posNum}`;
              return (
                <div key={posNum} className="flex items-center space-x-2.5 bg-slate-50 p-2 rounded-xl border border-slate-200">
                  <span className="w-6 h-6 rounded-lg bg-sky-100 text-sky-800 font-bold text-xs flex items-center justify-center flex-shrink-0">
                    {posNum}ª
                  </span>
                  <div className="flex-1">
                    <select
                      value={members[posKey]}
                      onChange={(e) => handleMemberChange(posKey, e.target.value)}
                      className="w-full bg-white border border-slate-200 text-slate-800 rounded-lg px-2 py-1 text-xs focus:ring-2 focus:ring-sky-400 outline-none"
                    >
                      <option value="">-- Corredor(a) Posta {posNum} --</option>
                      {schoolAthletes.map(ath => (
                        <option key={ath.id} value={ath.id}>
                          {ath.fullName} ({ath.gender === 'M' ? 'Var' : 'Fem'})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              );
            })}

            {/* Suplente */}
            <div className="flex items-center space-x-2.5 bg-slate-50/50 p-2 rounded-xl border border-dashed border-slate-200">
              <span className="w-6 h-6 rounded-lg bg-slate-200 text-slate-600 font-bold text-xs flex items-center justify-center flex-shrink-0">
                S
              </span>
              <div className="flex-1">
                <select
                  value={members.alternate}
                  onChange={(e) => handleMemberChange('alternate', e.target.value)}
                  className="w-full bg-white border border-slate-200 text-slate-600 rounded-lg px-2 py-1 text-xs focus:ring-2 focus:ring-sky-400 outline-none"
                >
                  <option value="">-- Suplente / Reserva (Opcional) --</option>
                  {schoolAthletes.map(ath => (
                    <option key={ath.id} value={ath.id}>
                      {ath.fullName} ({ath.gender === 'M' ? 'Var' : 'Fem'})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {errorMsg && (
            <div className="p-2.5 bg-rose-50 text-rose-700 border border-rose-200 rounded-xl text-xs flex items-center space-x-1.5">
              <AlertCircle className="w-4 h-4 text-rose-500 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}
        </div>

        <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex justify-end space-x-2">
          <button onClick={onClose} className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-800 font-semibold">
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-1.5 bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs rounded-xl shadow-xs flex items-center space-x-1"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Guardar Equipo</span>
          </button>
        </div>
      </div>
    </div>
  );
}
