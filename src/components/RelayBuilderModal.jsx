import React, { useState, useEffect } from 'react';
import { Users, X, Check, AlertCircle } from 'lucide-react';
import { OFFICIAL_EVENTS } from '../constants/events';

const EMPTY_MEMBERS = {
  pos1: '',
  pos2: '',
  pos3: '',
  pos4: '',
  alternate: ''
};

export default function RelayBuilderModal({
  isOpen,
  onClose,
  school,
  availableAthletes = [],
  existingRelays = [],
  onSaveRelay
}) {
  const [selectedEventId, setSelectedEventId] = useState('relevo_4x75m_mixto');
  const [members, setMembers] = useState(EMPTY_MEMBERS);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (isOpen) {
      setMembers(EMPTY_MEMBERS);
      setErrorMsg('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const relayEvents = OFFICIAL_EVENTS.filter(e => e.type === 'relevo');
  const activeEvent = relayEvents.find(e => e.id === selectedEventId) || relayEvents[0];

  const schoolAthletes = availableAthletes.filter(
    a => a.schoolId === school?.id || (school?.name && a.schoolName === school.name)
  );

  // Filtrar elegibles por rama según el tipo de relevo
  const eligibleAthletes = schoolAthletes.filter(a => {
    if (activeEvent.id === 'relevo_4x75m_varonil') return a.gender === 'M';
    if (activeEvent.id === 'relevo_4x75m_femenil') return a.gender === 'F';
    return true;
  });

  const handleMemberChange = (pos, athleteId) => {
    setMembers(prev => ({
      ...prev,
      [pos]: athleteId
    }));
    setErrorMsg('');
  };

  const handleSelectEvent = (eventId) => {
    setSelectedEventId(eventId);
    setMembers(EMPTY_MEMBERS);
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

    if (members.alternate && uniqueTitulares.has(members.alternate)) {
      setErrorMsg('El corredor suplente no puede ser uno de los 4 titulares.');
      return;
    }

    const rosterMembers = titulares.map(id => schoolAthletes.find(a => a.id === id)).filter(Boolean);
    if (rosterMembers.length < 4) {
      setErrorMsg('Verifica que los 4 atletas seleccionados pertenezcan a la escuela.');
      return;
    }

    if (activeEvent.id === 'relevo_4x75m_varonil' && rosterMembers.some(a => a.gender !== 'M')) {
      setErrorMsg('El Relevo 4x75m Varonil solo permite corredores varones.');
      return;
    }

    if (activeEvent.id === 'relevo_4x75m_femenil' && rosterMembers.some(a => a.gender !== 'F')) {
      setErrorMsg('El Relevo 4x75m Femenil solo permite corredoras mujeres.');
      return;
    }

    // Regla del Torneo: Máximo 2 equipos de relevos por competidor
    const allSelectedIds = members.alternate ? [...titulares, members.alternate] : titulares;
    for (const athId of allSelectedIds) {
      const alreadyInRelays = existingRelays.filter(
        r => r.eventId !== activeEvent.id && ((r.members || []).includes(athId) || r.alternate === athId)
      ).length;
      if (alreadyInRelays >= 2) {
        const ath = schoolAthletes.find(a => a.id === athId);
        setErrorMsg(`El alumno ${ath?.fullName || 'seleccionado'} ya está inscrito en 2 equipos de relevos (máximo 2 por competidor).`);
        return;
      }
    }

    if (activeEvent.id === 'relevo_4x75m_mixto') {
      const mCount = rosterMembers.filter(a => a.gender === 'M').length;
      const fCount = rosterMembers.filter(a => a.gender === 'F').length;

      if (mCount !== 2 || fCount !== 2) {
        setErrorMsg('El Relevo Mixto exige exactamente 2 varones y 2 mujeres.');
        return;
      }

      // Validar orden alternado estricto: V-F-V-F o F-V-F-V
      const genders = rosterMembers.map(a => a.gender);
      const isAlternating =
        genders[0] !== genders[1] &&
        genders[1] !== genders[2] &&
        genders[2] !== genders[3];

      if (!isAlternating) {
        setErrorMsg('En el Relevo Mixto las postas deben ir en orden alternado (V-F-V-F o F-V-F-V).');
        return;
      }
    }

    const sameSchoolCount = existingRelays.filter(
      r => r.schoolId === school.id && r.eventId === activeEvent.id
    ).length;
    const teamSuffix = sameSchoolCount > 0 ? ` (Equipo ${String.fromCharCode(65 + sameSchoolCount)})` : '';

    const relayTeam = {
      id: `relay-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      schoolId: school.id,
      schoolName: `${school.name}${teamSuffix}`,
      baseSchoolName: school.name,
      eventId: activeEvent.id,
      eventName: activeEvent.name,
      members: titulares,
      alternate: members.alternate || null,
      createdAt: new Date().toISOString()
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
                  onClick={() => handleSelectEvent(ev.id)}
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
                <strong>Regla Oficial Mixta:</strong> Requiere 2 varones y 2 mujeres en orden alternado (V-F-V-F o F-V-F-V).
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
                  <div className="flex-1 min-w-0">
                    <select
                      value={members[posKey]}
                      onChange={(e) => handleMemberChange(posKey, e.target.value)}
                      className="w-full bg-white border border-slate-200 text-slate-800 rounded-lg px-2 py-1 text-xs focus:ring-2 focus:ring-sky-400 outline-none"
                    >
                      <option value="">-- Corredor(a) Posta {posNum} --</option>
                      {eligibleAthletes.map(ath => (
                        <option key={ath.id} value={ath.id}>
                          #{ath.bibNumber || 'S/N'} - {ath.fullName} ({ath.gender === 'M' ? 'Var' : 'Fem'}, {ath.schoolGrade || '?'}°)
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
              <div className="flex-1 min-w-0">
                <select
                  value={members.alternate}
                  onChange={(e) => handleMemberChange('alternate', e.target.value)}
                  className="w-full bg-white border border-slate-200 text-slate-600 rounded-lg px-2 py-1 text-xs focus:ring-2 focus:ring-sky-400 outline-none"
                >
                  <option value="">-- Suplente / Reserva (Opcional) --</option>
                  {eligibleAthletes.map(ath => (
                    <option key={ath.id} value={ath.id}>
                      #{ath.bibNumber || 'S/N'} - {ath.fullName} ({ath.gender === 'M' ? 'Var' : 'Fem'}, {ath.schoolGrade || '?'}°)
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
