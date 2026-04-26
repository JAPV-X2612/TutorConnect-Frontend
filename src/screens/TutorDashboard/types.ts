/** Single upcoming session returned by GET /dashboard/tutor. */
export interface ProximaSesion {
  id: string;
  fecha: string;           // ISO 8601 UTC — parse with new Date(fecha)
  aprendiz_nombre: string; // full name; "N/A" if learner profile is missing
  materia: string | null;  // null when not set on the booking
}

/** Aggregate metrics for the tutor's current calendar month. */
export interface TutorMetricas {
  total_sesiones: number;
  ingresos_totales: number;
  moneda: string;          // always "COP" for this MVP
  periodo: string;         // YYYY-MM, e.g. "2026-04"
  calificacion_promedio: number | null; // null when the tutor has zero reviews
  total_resenas: number;
}

/** Full response shape of GET /dashboard/tutor. */
export interface TutorDashboardData {
  metricas: TutorMetricas;
  proximas_sesiones: ProximaSesion[]; // max 5, sorted by fecha asc
}
