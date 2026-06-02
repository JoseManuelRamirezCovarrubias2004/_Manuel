import React, { useState, useEffect, useRef, useCallback } from 'react';
const API_URL = "https://crm.grupoautomotrizryr.com";
const API_WHATSAPP = "https://graph.facebook.com/v25.0";

const getStoredToken = () => {
  try {
    const access = localStorage.getItem("auth.access");
    if (access && access !== "undefined" && access !== "null") return access;
    const rawAuth = localStorage.getItem("auth");
    if (!rawAuth) return null;
    const parsed = JSON.parse(rawAuth);
    const token = parsed?.token;
    if (token && token !== "undefined" && token !== "null") return token;
    return null;
  } catch { return null; }
};

const getAuthHeader = () => {
  const token = getStoredToken();
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
};

// ✅ CORREGIDO: trae TODAS las páginas si la API pagina los resultados
const listarEncuestas = async () => {
  let url = `${API_URL}/api/encuestas/satisfaccion/`;
  let allResults = [];

  while (url) {
    const res = await fetch(url, {
      headers: { ...getAuthHeader() }
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    // Soporta respuesta paginada { count, next, results } Y array directo
    if (Array.isArray(data)) {
      allResults = [...allResults, ...data];
      break;
    } else {
      allResults = [...allResults, ...(data.results || [])];
      url = data.next || null; // siguiente página, o null si no hay más
    }
  }

  return allResults;
};

const EncuestasWhats = () => {
  const [config, setConfig] = useState({
    accessToken: '',
    phoneId: '1180313015157033',
    template: 'encuesta_satisfaccion',
    lang: 'en_US'
  });
  const [formData, setFormData] = useState({
    clientName: '',
    countryCode: '52',
    phoneNumber: '',
    advisor: ''
  });
  const [logs, setLogs] = useState([]);
  const [responses, setResponses] = useState([]);
  const [syncStatus, setSyncStatus] = useState(false);
  const [activeTab, setActiveTab] = useState('responses');
  const [configOpen, setConfigOpen] = useState(false);
  const [showToken, setShowToken] = useState(false);
  const [alert, setAlert] = useState({ show: false, type: '', message: '' });
  const [isSending, setIsSending] = useState(false);
  const [deletedIds, setDeletedIds] = useState(new Set());
  const lastJsonRef = useRef('');

  useEffect(() => {
    const savedConfig = localStorage.getItem('vw_config');
    if (savedConfig) {
      try {
        const parsed = JSON.parse(savedConfig);
        setConfig(prev => ({ ...prev, ...parsed }));
      } catch (e) {}
    }
  }, []);

  const saveConfig = useCallback(() => {
    localStorage.setItem('vw_config', JSON.stringify(config));
    showAlert('ok', 'Configuración guardada ✓');
  }, [config]);

  const showAlert = (type, message) => {
    setAlert({ show: true, type, message });
    if (type === 'ok') setTimeout(() => setAlert({ show: false, type: '', message: '' }), 4000);
  };

  const getItemKey = (r) => String(r.id_encuesta || r.id || JSON.stringify(r).slice(0, 60));

  const cargarRespuestas = useCallback(async () => {

    
    try {
      const lista = await listarEncuestas(); // ✅ ya es un array plano con todos los resultados
      setSyncStatus(true);
      const filtered = lista.filter(r => !deletedIds.has(getItemKey(r)));
      const newJson = JSON.stringify(filtered);
      if (lastJsonRef.current === newJson) return;
      lastJsonRef.current = newJson;
      setResponses(filtered);
    } catch (err) {
      setSyncStatus(false);
    }
  }, [deletedIds]);

 useEffect(() => {
  cargarRespuestas();

  const testApi = async () => {
    const lista = await listarEncuestas();

    console.log("API_URL:", API_URL);
    console.log("RESPUESTA:", lista);
  };

  testApi();

  const interval = setInterval(cargarRespuestas, 3000);

  return () => clearInterval(interval);
}, [cargarRespuestas]);
  const addLog = (name, phone, advisor, status) => {
    const now = new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
    setLogs(prev => [{ name, phone, advisor, time: now, status }, ...prev]);
  };

  const renderStars = (val, max = 5) => {
    const n = Math.min(Math.max(parseInt(val) || 0, 0), max);
    return Array.from({ length: max }, (_, i) => (
      <span key={i} style={{ color: i < n ? '#f59e0b' : '#d1d5db', fontSize: '14px', lineHeight: '1' }}>
        {i < n ? '★' : '☆'}
      </span>
    ));
  };

  const scoreColor = (val) => {
    const n = parseInt(val) || 0;
    if (n >= 4) return 'high';
    if (n >= 2) return 'mid';
    return n > 0 ? 'low' : '';
  };

  const deleteCard = (key) => {
    setDeletedIds(prev => new Set([...prev, key]));
  };

  const sendSurvey = async () => {
    setAlert({ show: false, type: '', message: '' });
    const { clientName, countryCode, phoneNumber, advisor } = formData;
    const { accessToken, phoneId, template, lang } = config;

    if (!clientName) { showAlert('err', 'Ingresa el nombre del cliente.'); return; }
    if (!phoneNumber) { showAlert('err', 'Ingresa el número de WhatsApp.'); return; }
    if (!accessToken) {
      setConfigOpen(true);
      showAlert('err', 'Configura tu token de acceso primero.');
      return;
    }

    const fullPhone = countryCode + phoneNumber.replace(/\D/g, '');
    setIsSending(true);

    const body = {
      messaging_product: "whatsapp",
      to: fullPhone,
      type: "template",
      template: {
        name: template,
        language: { code: lang },
        components: [{ type: "button", sub_type: "flow", index: "0", parameters: [{ type: "action", action: { flow_token: "unused" } }] }]
      }
    };

    try {
      const res = await fetch(`${API_WHATSAPP}/${phoneId}/messages`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (res.ok && data.messages) {
        showAlert('ok', `Encuesta enviada a ${clientName} (+${fullPhone})`);
        addLog(clientName, fullPhone, advisor, 'ok');
        setFormData({ ...formData, clientName: '', phoneNumber: '', advisor: '' });
      } else {
        const errMsg = data.error?.message || 'Error desconocido';
        showAlert('err', errMsg);
        addLog(clientName, fullPhone, advisor, 'err');
      }
    } catch (e) {
      showAlert('err', 'Error de conexión. Verifica tu token e intenta de nuevo.');
      addLog(clientName, fullPhone, advisor, 'err');
    }
    setIsSending(false);
  };

  const okCount = logs.filter(l => l.status === 'ok').length;
  const errCount = logs.filter(l => l.status === 'err').length;

  const dotStyle = {
    high: { background: 'rgba(34,197,94,.25)', borderColor: 'rgba(34,197,94,.4)', color: '#86efac' },
    mid:  { background: 'rgba(234,179,8,.2)',  borderColor: 'rgba(234,179,8,.35)',  color: '#fde047' },
    low:  { background: 'rgba(239,68,68,.2)',  borderColor: 'rgba(239,68,68,.35)',  color: '#fca5a5' },
    '':   { background: 'rgba(255,255,255,.1)',borderColor: 'rgba(255,255,255,.15)',color: 'white'   },
  };

  const ResponseCard = ({ response }) => {
    const [isOpen, setIsOpen] = useState(false);
    const scores = [
      { label: 'Atención asesor',   icon: '⭐', val: response.atencion_asesor },
      { label: 'Seguimiento',       icon: '🔁', val: response.seguimiento_asesor },
      { label: 'Tiempo de entrega', icon: '⏱️', val: response.tiempo_entrega_unidad },
      { label: 'Recepción',         icon: '🏢', val: response.experiencia_recepcion },
    ];
    const fecha = response.creado
      ? new Date(response.creado).toLocaleString('es-MX', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
      : '—';
    const key = getItemKey(response);

    return (
      <div style={{ border: '1px solid #e5e7eb', borderRadius: '12px', overflow: 'hidden', marginBottom: '8px', background: 'white' }}>
        <div
          onClick={() => setIsOpen(!isOpen)}
          style={{ background: '#001e50', display: 'flex', alignItems: 'center', gap: '10px', padding: '11px 14px', cursor: 'pointer' }}
        >
          <span style={{ color: 'rgba(255,255,255,.4)', fontSize: '11px', transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform .2s', flexShrink: 0 }}>▼</span>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '6px', fontFamily: 'monospace', fontSize: '12px', fontWeight: 500, color: 'white' }}>
            👤 {response.nombre_cliente || '(sin nombre)'}
            <span style={{ fontSize: '9px', color: 'rgba(255,255,255,.35)', fontWeight: 400 }}>{response.agencia || ''} · {response.asesor_atendio || ''}</span>
          </div>
          <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
            {scores.map((s, idx) => {
              const cls = scoreColor(s.val);
              const style = dotStyle[cls] || dotStyle[''];
              return (
                <div key={idx}
                  style={{ width: '20px', height: '20px', borderRadius: '50%', border: '1px solid', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'monospace', fontSize: '9px', fontWeight: 600, ...style }}
                  title={`${s.label}: ${s.val ?? '—'}`}>
                  {s.val ?? '?'}
                </div>
              );
            })}
          </div>
          <div style={{ fontSize: '10px', color: 'rgba(255,255,255,.4)', fontFamily: 'monospace', whiteSpace: 'nowrap' }}>{fecha}</div>
          <button
            onClick={(e) => { e.stopPropagation(); deleteCard(key); }}
            title="Ocultar"
            style={{ background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.1)', borderRadius: '6px', color: 'rgba(248,113,113,.7)', cursor: 'pointer', width: '26px', height: '26px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '12px' }}>
            ✕
          </button>
        </div>

        {isOpen && (
          <div style={{ padding: '14px', borderTop: '1px solid #e5e7eb' }}>
            <div style={{ marginBottom: '10px', fontSize: '12px', color: '#4b5563' }}>
              <strong>Motivo de visita:</strong> {response.motivo_visita || '—'}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '10px' }}>
              {scores.map((s, idx) => (
                <div key={idx} style={{ background: '#f8fafd', border: '1px solid #e5e7eb', borderRadius: '9px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ fontSize: '10px', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.icon} {s.label}</div>
                    <div style={{ fontFamily: 'monospace', fontSize: '18px', fontWeight: 600, color: '#111827', lineHeight: 1 }}>{s.val != null ? s.val : '—'}</div>
                  </div>
                  <div style={{ display: 'flex', gap: '3px' }}>{renderStars(s.val)}</div>
                </div>
              ))}
            </div>
            <div style={{ background: '#f8fafd', border: '1px solid #e5e7eb', borderLeft: '4px solid #00b0f0', borderRadius: '9px', padding: '10px 14px' }}>
              <div style={{ fontSize: '10px', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>📝 Comentarios</div>
              <div style={{ fontSize: '13px', color: '#4b5563', lineHeight: '1.55' }}>
                {response.comentario && response.comentario.trim()
                  ? <p style={{ margin: 0 }}>{response.comentario}</p>
                  : <p style={{ margin: 0, color: '#9ca3af', fontStyle: 'italic', fontSize: '12px' }}>Sin comentarios</p>}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const cardStyle = {
    background: 'white',
    borderRadius: '20px',
    border: '1px solid #e5e7eb',
    overflow: 'hidden',
    boxShadow: '0 1px 3px rgba(0,0,0,.06),0 4px 16px rgba(0,30,80,.06)'
  };
  const cardHeaderStyle = {
    padding: '1rem 1.5rem',
    borderBottom: '1px solid #e5e7eb',
    display: 'flex',
    alignItems: 'center',
    gap: '10px'
  };
  const labelStyle = {
    display: 'block',
    fontSize: '11px',
    fontWeight: 600,
    color: '#6b7280',
    marginBottom: '5px',
    textTransform: 'uppercase',
    letterSpacing: '0.08em'
  };
  const inputStyle = {
    width: '100%',
    padding: '10px 14px',
    border: '1.5px solid #e5e7eb',
    borderRadius: '9px',
    fontSize: '14px',
    color: '#111827',
    background: '#f8fafd',
    outline: 'none',
    boxSizing: 'border-box',
    fontFamily: 'inherit'
  };

  return (
    <>
      <style>{`
        @keyframes pulse2 {
          0%,100%{box-shadow:0 0 0 3px rgba(37,211,102,.2)}
          50%{box-shadow:0 0 0 6px rgba(37,211,102,.05)}
        }
        @keyframes spin { to{transform:rotate(360deg)} }
        @keyframes fadeIn { from{opacity:0;transform:translateY(-4px)} to{opacity:1;transform:translateY(0)} }
        .dot-pulse { animation: pulse2 2s infinite; }
        .spinner-anim { animation: spin .7s linear infinite; }
        .encuestas-scrollbar::-webkit-scrollbar { width: 4px; }
        .encuestas-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 99px; }
        .encuestas-input:focus {
          border-color: #00b0f0 !important;
          background: white !important;
          box-shadow: 0 0 0 3px rgba(0,176,240,.15) !important;
        }
        .encuestas-btn-wa:hover { background: #1ebe5d !important; }
        .encuestas-btn-wa:active { transform: scale(.98); }
        .encuestas-btn-wa:disabled { background: #9ca3af !important; box-shadow: none !important; cursor: not-allowed; }
      `}</style>

      <div style={{ display: 'grid', gridTemplateColumns: '370px 1fr', gap: '24px', alignItems: 'start', fontFamily: 'Epilogue, sans-serif' }}>

        {/* ── FORMULARIO ── */}
        <div style={cardStyle}>
          <div style={cardHeaderStyle}>
            <div style={{ width: '32px', height: '32px', borderRadius: '9px', background: '#dcfce7', color: '#166534', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347zM12 0C5.373 0 0 5.373 0 12c0 2.126.556 4.121 1.523 5.851L.057 23.882a.5.5 0 00.61.61l6.001-1.448A11.934 11.934 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.886 0-3.655-.523-5.168-1.427l-.362-.216-3.747.904.921-3.668-.232-.373A9.944 9.944 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
              </svg>
            </div>
            <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: '12px', fontWeight: 700, color: '#111827', letterSpacing: '0.1em', textTransform: 'uppercase', margin: 0 }}>
              Enviar por WhatsApp
            </h2>
          </div>

          <div style={{ padding: '1.4rem' }}>
            <div style={{ display: 'flex', gap: '8px', background: 'linear-gradient(135deg,#eff6ff,#f0f9ff)', border: '1px solid #bfdbfe', borderRadius: '10px', padding: '11px 14px', fontSize: '12.5px', color: '#1e40af', lineHeight: '1.55', marginBottom: '20px' }}>
              <span>📋</span>
              <span>Ingresa los datos del cliente para enviarle la encuesta de satisfacción directamente a su WhatsApp.</span>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={labelStyle}>Nombre del cliente</label>
              <input className="encuestas-input" type="text" placeholder="Ej: Juan García"
                value={formData.clientName} onChange={(e) => setFormData({...formData, clientName: e.target.value})}
                style={inputStyle} />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={labelStyle}>Número de WhatsApp</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <select className="encuestas-input" value={formData.countryCode} onChange={(e) => setFormData({...formData, countryCode: e.target.value})}
                  style={{ ...inputStyle, width: '110px', flexShrink: 0, appearance: 'none' }}>
                  <option value="52">🇲🇽 +52</option>
                  <option value="1">🇺🇸 +1</option>
                  <option value="54">🇦🇷 +54</option>
                  <option value="57">🇨🇴 +57</option>
                </select>
                <input className="encuestas-input" type="tel" placeholder="2711234567"
                  value={formData.phoneNumber} onChange={(e) => setFormData({...formData, phoneNumber: e.target.value})}
                  style={{ ...inputStyle, flex: 1 }} />
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={labelStyle}>Asesor que atendió</label>
              <input className="encuestas-input" type="text" placeholder="Ej: Carlos Pérez"
                value={formData.advisor} onChange={(e) => setFormData({...formData, advisor: e.target.value})}
                style={inputStyle} />
            </div>

            <button className="encuestas-btn-wa" onClick={sendSurvey} disabled={isSending}
              style={{ width: '100%', marginTop: '20px', padding: '13px 20px', background: '#25d366', color: 'white', border: 'none', borderRadius: '12px', fontFamily: 'Syne, sans-serif', fontSize: '15px', fontWeight: 700, letterSpacing: '0.03em', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', cursor: 'pointer', transition: 'all .2s', boxShadow: '0 4px 14px rgba(37,211,102,.3)' }}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347zM12 0C5.373 0 0 5.373 0 12c0 2.126.556 4.121 1.523 5.851L.057 23.882a.5.5 0 00.61.61l6.001-1.448A11.934 11.934 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.886 0-3.655-.523-5.168-1.427l-.362-.216-3.747.904.921-3.668-.232-.373A9.944 9.944 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
              </svg>
              <span>{isSending ? 'Enviando...' : 'Enviar encuesta'}</span>
              {isSending && <div className="spinner-anim" style={{ width: '16px', height: '16px', borderRadius: '50%', border: '2px solid rgba(255,255,255,.35)', borderTopColor: 'white' }}></div>}
            </button>

            {alert.show && (
              <div style={{ marginTop: '12px', padding: '10px 14px', borderRadius: '10px', fontSize: '13px', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '8px', animation: 'fadeIn .2s ease', ...(alert.type === 'ok' ? { background: '#dcfce7', color: '#166534' } : { background: '#fee2e2', color: '#991b1b' }) }}>
                {alert.type === 'ok' ? '✅' : '❌'} {alert.message}
              </div>
            )}

            <div onClick={() => setConfigOpen(!configOpen)}
              style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#9ca3af', cursor: 'pointer', userSelect: 'none', width: 'fit-content', padding: '4px 8px', borderRadius: '6px' }}>
              <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="3"/>
                <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/>
              </svg>
              Configuración de la API
              <svg style={{ transition: 'transform .2s', transform: configOpen ? 'rotate(180deg)' : 'none', width: '11px', height: '11px' }}
                fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path d="M6 9l6 6 6-6"/>
              </svg>
            </div>

            {configOpen && (
              <div style={{ marginTop: '12px', paddingTop: '16px', borderTop: '1px dashed #e5e7eb' }}>
                <div style={{ marginBottom: '16px' }}>
                  <label style={labelStyle}>Token de acceso WhatsApp</label>
                  <div style={{ position: 'relative' }}>
                    <input className="encuestas-input" type={showToken ? 'text' : 'password'} placeholder="Pega tu token aquí..."
                      value={config.accessToken} onChange={(e) => setConfig({...config, accessToken: e.target.value})}
                      style={{ ...inputStyle, paddingRight: '60px', fontFamily: 'monospace', fontSize: '11px' }} />
                    <button onClick={() => setShowToken(!showToken)}
                      style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', fontSize: '11px', fontWeight: 600, color: '#00b0f0', background: 'transparent', border: 'none', cursor: 'pointer', padding: '2px 6px' }}>
                      {showToken ? 'Ocultar' : 'Ver'}
                    </button>
                  </div>
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label style={labelStyle}>Phone Number ID</label>
                  <input className="encuestas-input" type="text" value={config.phoneId} onChange={(e) => setConfig({...config, phoneId: e.target.value})}
                    style={{ ...inputStyle, fontFamily: 'monospace', fontSize: '11px' }} />
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label style={labelStyle}>Nombre de la plantilla</label>
                  <input className="encuestas-input" type="text" value={config.template} onChange={(e) => setConfig({...config, template: e.target.value})}
                    style={inputStyle} />
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label style={labelStyle}>Idioma de la plantilla</label>
                  <select className="encuestas-input" value={config.lang} onChange={(e) => setConfig({...config, lang: e.target.value})}
                    style={{ ...inputStyle, appearance: 'none' }}>
                    <option value="en">English (en)</option>
                    <option value="es">Español (es)</option>
                    <option value="es_MX">Español México (es_MX)</option>
                    <option value="en_US">Inglés US (en_US)</option>
                  </select>
                </div>

                <button onClick={saveConfig}
                  style={{ width: '100%', padding: '9px', background: '#001e50', color: 'white', border: 'none', borderRadius: '9px', fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '12px', letterSpacing: '0.1em', cursor: 'pointer' }}>
                  💾 Guardar configuración
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ── PANEL DERECHO ── */}
        <div style={cardStyle}>
          <div style={cardHeaderStyle}>
            <div style={{ width: '32px', height: '32px', borderRadius: '9px', background: '#eff6ff', color: '#001e50', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <rect x="3" y="3" width="18" height="18" rx="2"/>
                <path d="M3 9h18M9 21V9"/>
              </svg>
            </div>
            <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: '12px', fontWeight: 700, color: '#111827', letterSpacing: '0.1em', textTransform: 'uppercase', margin: 0 }}>
              Panel de resultados
            </h2>
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '6px', fontFamily: 'monospace', fontSize: '10px', color: '#9ca3af' }}>
              <span className={syncStatus ? 'dot-pulse' : ''} style={{ width: '6px', height: '6px', borderRadius: '50%', display: 'inline-block', background: syncStatus ? '#22c55e' : '#f87171' }}></span>
              <span>{syncStatus ? 'Conectado' : 'Sin conexión'}</span>
            </div>
          </div>

          <div style={{ padding: '1.4rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '24px' }}>
              {[
                { id: 'total', val: responses.length, label: 'Total',    barColor: '#001e50', textColor: '#001e50' },
                { id: 'ok',    val: okCount,          label: 'Enviados', barColor: '#25d366', textColor: '#166534' },
                { id: 'err',   val: errCount,         label: 'Fallidos', barColor: '#ef4444', textColor: '#991b1b' },
              ].map(s => (
                <div key={s.id} style={{ background: '#f8fafd', border: '1px solid #e5e7eb', borderRadius: '14px', overflow: 'hidden', textAlign: 'center' }}>
                  <div style={{ height: '3px', background: s.barColor }}></div>
                  <div style={{ padding: '14px 12px' }}>
                    <div style={{ fontFamily: 'monospace', fontSize: '28px', fontWeight: 500, lineHeight: 1, marginBottom: '4px', color: s.textColor }}>{s.val}</div>
                    <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#9ca3af' }}>{s.label}</div>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '4px', background: '#f8fafd', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '4px', marginBottom: '20px' }}>
              {[
                { id: 'responses', label: '📊 Respuestas de clientes' },
                { id: 'logs',      label: '📋 Registro de envíos' },
              ].map(tab => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  style={{ flex: 1, padding: '7px 10px', fontSize: '12px', fontFamily: 'Syne, sans-serif', fontWeight: 600, borderRadius: '7px', border: 'none', cursor: 'pointer', transition: 'all .2s', letterSpacing: '0.03em', background: activeTab === tab.id ? 'white' : 'transparent', color: activeTab === tab.id ? '#001e50' : '#9ca3af', boxShadow: activeTab === tab.id ? '0 1px 4px rgba(0,0,0,.08)' : 'none' }}>
                  {tab.label}
                </button>
              ))}
            </div>

            {activeTab === 'responses' && (
              <div className="encuestas-scrollbar" style={{ maxHeight: '560px', overflowY: 'auto', paddingRight: '4px' }}>
                {responses.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px 16px', color: '#9ca3af', fontSize: '13px' }}>
                    <div style={{ fontSize: '32px', marginBottom: '12px', opacity: 0.5 }}>💬</div>
                    <p style={{ margin: 0 }}>Sin respuestas aún.<br /><span style={{ fontSize: '11px' }}>Se actualizan automáticamente cada 3 segundos.</span></p>
                  </div>
                ) : (
                  responses.map((response) => <ResponseCard key={getItemKey(response)} response={response} />)
                )}
              </div>
            )}

            {activeTab === 'logs' && (
              <div>
                {logs.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px 16px', color: '#9ca3af', fontSize: '13px' }}>
                    <div style={{ fontSize: '32px', marginBottom: '12px', opacity: 0.5 }}>📤</div>
                    <p style={{ margin: 0 }}>Aún no hay envíos registrados.<br />Envía tu primera encuesta.</p>
                  </div>
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                    <thead>
                      <tr>
                        {['Cliente','Número','Asesor','Hora','Estado'].map(h => (
                          <th key={h} style={{ textAlign: 'left', padding: '7px 10px', color: '#9ca3af', fontWeight: 600, borderBottom: '1px solid #e5e7eb', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'Syne, sans-serif' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {logs.map((log, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid #f3f4f6' }}>
                          <td style={{ padding: '10px' }}>{log.name}</td>
                          <td style={{ padding: '10px', fontFamily: 'monospace', fontSize: '11px' }}>+{log.phone}</td>
                          <td style={{ padding: '10px' }}>{log.advisor || '—'}</td>
                          <td style={{ padding: '10px', fontFamily: 'monospace', fontSize: '11px' }}>{log.time}</td>
                          <td style={{ padding: '10px' }}>
                            {log.status === 'ok'
                              ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '2px 10px', borderRadius: '99px', fontSize: '10px', fontWeight: 700, fontFamily: 'Syne, sans-serif', background: '#dcfce7', color: '#166534' }}>✓ Enviado</span>
                              : <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '2px 10px', borderRadius: '99px', fontSize: '10px', fontWeight: 700, fontFamily: 'Syne, sans-serif', background: '#fee2e2', color: '#991b1b' }}>✗ Error</span>
                            }
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default EncuestasWhats;

