// Sin nuevas carpetas. Helpers + lógica en este controller.
const { sequelize } = require('../models'); // para lecturas opcionales de viaje_maestro

// ===== CONFIG SIMPLE (ajústalo a tu realidad) =====
const PRICING = {
  CURRENCY: 'GTQ',
  ROUND_TO: 0.5,     // redondeo a múltiplos de Q0.50
  BASE_FARE: 5,      // bajada de bandera
  PER_KM: 3.5,
  PER_MIN: 0.4,
  MIN_FARE: 12,
  SURGE_RULES: [
    { days: [1,2,3,4,5], from: '07:00', to: '09:00', factor: 1.2 },
    { days: [1,2,3,4,5], from: '17:00', to: '19:00', factor: 1.2 }
  ],
  PLATFORM_FEE_PCT: 0.10,
  SUGGESTED_MARGIN_PCT: 0.05
};

// ===== HELPERS =====
function roundTo(v, step = 0.5) { return Math.round(v / step) * step; }
function parseHHMM(hhmm){ const [h,m]=hhmm.split(':').map(Number); return {h,m}; }
function isWithin(date, fromHHMM, toHHMM){
  const {h:fh,m:fm}=parseHHMM(fromHHMM); const {h:th,m:tm}=parseHHMM(toHHMM);
  const mins=date.getHours()*60+date.getMinutes(); const a=fh*60+fm; const b=th*60+tm;
  return mins>=a && mins<=b;
}
function surgeFactorFor(date){
  const day = date.getDay(); // 0=Dom
  for(const r of PRICING.SURGE_RULES){
    if(r.days.includes(day) && isWithin(date, r.from, r.to)) return r.factor;
  }
  return 1.0;
}
function haversineKm(a,b){
  const R=6371, dLat=(b.lat-a.lat)*Math.PI/180, dLng=(b.lng-a.lng)*Math.PI/180;
  const lat1=a.lat*Math.PI/180, lat2=b.lat*Math.PI/180;
  const h = Math.sin(dLat/2)**2 + Math.cos(lat1)*Math.cos(lat2)*Math.sin(dLng/2)**2;
  return 2*R*Math.asin(Math.sqrt(h));
}

/**
 * Si no viene origin/destination, intenta leerlos desde viaje_maestro.
 * Ajusta nombres de columnas según tu esquema real.
 */
async function fillFromViajeMaestro(payload) {
  if (payload.origin && payload.destination) return payload;

  if (!payload.id_viaje_maestro) {
    throw new Error('Faltan origin/destination o id_viaje_maestro para inferirlos');
  }

  const [row] = await sequelize.query(
    `
    SELECT 
      v.origen_lat   AS o_lat,  v.origen_lng   AS o_lng,
      v.destino_lat  AS d_lat,  v.destino_lng  AS d_lng,
      v.fecha_salida AS fecha_salida
    FROM viaje_maestro v
    WHERE v.id_viaje_maestro = :id
    `,
    { replacements: { id: payload.id_viaje_maestro }, type: sequelize.QueryTypes.SELECT }
  );

  if (!row || row.o_lat == null || row.d_lat == null) {
    throw new Error('No se pudieron obtener coordenadas desde viaje_maestro');
  }

  return {
    ...payload,
    origin:      payload.origin      ?? { lat: Number(row.o_lat), lng: Number(row.o_lng) },
    destination: payload.destination ?? { lat: Number(row.d_lat), lng: Number(row.d_lng) },
    departureTime: payload.departureTime ?? row.fecha_salida
  };
}

async function getDistanceDuration({origin,destination}){
  // Placeholder: Haversine + velocidad promedio (mejor integrar Google/Mapbox/OSRM)
  const km = haversineKm(origin, destination);
  const minutes = (km / 30) * 60; // 30 km/h promedio urbano
  return { km, minutes };
}

async function estimateFareCore(input){
  const payload = await fillFromViajeMaestro(input);

  if(!payload.origin || !payload.destination) throw new Error('origin y destination requeridos');
  const when = payload.departureTime ? new Date(payload.departureTime) : new Date();
  const { km, minutes } = await getDistanceDuration({ origin: payload.origin, destination: payload.destination });

  let raw = PRICING.BASE_FARE + PRICING.PER_KM * km + PRICING.PER_MIN * minutes;
  raw = Math.max(raw, PRICING.MIN_FARE);

  const surge = surgeFactorFor(when);
  const base = raw;
  const extras = Number(payload.extras || 0);
  const surged = (base + extras) * surge;
  const platformFee = surged * (PRICING.PLATFORM_FEE_PCT || 0);
  const total = surged + platformFee;

  const pricing = {
    currency: PRICING.CURRENCY,
    base: roundTo(base, PRICING.ROUND_TO),
    extras: roundTo(extras, PRICING.ROUND_TO),
    surgeMultiplier: surge,
    platformFee: roundTo(platformFee, PRICING.ROUND_TO),
    total: roundTo(total, PRICING.ROUND_TO)
  };

  const seats = Number(payload.seats || payload.capacidad_total || 1);
  const driverNet = pricing.total * (1 - (PRICING.PLATFORM_FEE_PCT || 0));
  const suggestedPerSeat = seats > 0
    ? roundTo((driverNet * (1 + (PRICING.SUGGESTED_MARGIN_PCT || 0))) / seats, PRICING.ROUND_TO)
    : null;

  return {
    distanceKm: Number(km.toFixed(2)),
    durationMin: Number(minutes.toFixed(0)),
    pricing,
    suggestedPerSeat
  };
}

// ===== CONTROLLER =====
module.exports = {
  estimate: async (req, res) => {
    try {
      const result = await estimateFareCore(req.body);
      res.json(result);
    } catch (e) {
      res.status(400).json({ message: e.message || 'No se pudo estimar la tarifa' });
    }
  },
  // export para reutilizar en crear-grupo
  _estimateFareCore: estimateFareCore
};
