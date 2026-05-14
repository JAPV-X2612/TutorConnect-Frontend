export const CITIES = [
  'Bogotá',
  'Medellín',
  'Cali',
  'Barranquilla',
  'Cartagena',
  'Bucaramanga',
  'Pereira',
  'Manizales',
  'Santa Marta',
  'Cúcuta',
  'Ibagué',
  'Villavicencio',
];

export const ORGANIZATIONS = [
  'Universidad Nacional de Colombia',
  'Universidad de los Andes',
  'Pontificia Universidad Javeriana',
  'Universidad del Rosario',
  'Universidad de Antioquia',
  'EAFIT',
  'Escuela Colombiana de Ingeniería',
  'Universidad Externado',
  'Universidad de la Sabana',
  'Universidad Distrital',
  'Universidad Pedagógica Nacional',
  'ICESI',
  'Universidad del Norte',
  'Politécnico Grancolombiano',
  'SENA',
];

export const PROGRAMS = [
  'Ingeniería de Sistemas',
  'Ingeniería Industrial',
  'Administración de Empresas',
  'Medicina',
  'Derecho',
  'Psicología',
  'Contaduría Pública',
  'Economía',
  'Ingeniería Civil',
  'Arquitectura',
  'Diseño Gráfico',
  'Comunicación Social',
  'Biología',
  'Química',
  'Matemáticas',
  'Física',
  'Enfermería',
  'Trabajo Social',
];

export const MODALIDADES = ['Presencial', 'Virtual', 'Ambas'];

export const ACADEMIC_LEVELS = [
  'Bachiller',
  'Técnico',
  'Tecnólogo',
  'Pregrado',
  'Especialización',
  'Maestría',
  'Doctorado',
];

export interface CourseCategory {
  id: string;
  label: string;
  subjects: string[];
}

export const COURSE_CATEGORIES: CourseCategory[] = [
  {
    id: 'sciences',
    label: 'Ciencias',
    subjects: ['Matemáticas', 'Física', 'Química', 'Biología', 'Estadística', 'Cálculo multivariado', 'Álgebra lineal', 'Geometría'],
  },
  {
    id: 'tech',
    label: 'Tecnología',
    subjects: ['Programación', 'Desarrollo web', 'Python', 'JavaScript', 'Inteligencia artificial', 'Bases de datos', 'Diseño UX/UI', 'Ciberseguridad'],
  },
  {
    id: 'languages',
    label: 'Idiomas',
    subjects: ['Inglés', 'Francés', 'Italiano', 'Portugués', 'Alemán', 'Mandarín', 'Japonés', 'Español para extranjeros'],
  },
  {
    id: 'gastronomy',
    label: 'Gastronomía',
    subjects: ['Cocina francesa', 'Repostería', 'Panadería', 'Cocina italiana', 'Cocina colombiana', 'Sushi', 'Cocina vegana', 'Chocolatería'],
  },
  {
    id: 'arts',
    label: 'Arte & Música',
    subjects: ['Guitarra', 'Piano', 'Canto', 'Pintura al óleo', 'Acuarela', 'Fotografía', 'Dibujo', 'Escultura', 'Producción musical'],
  },
  {
    id: 'business',
    label: 'Negocios',
    subjects: ['Finanzas personales', 'Contabilidad', 'Marketing digital', 'Emprendimiento', 'Excel avanzado', 'Economía', 'Gestión de proyectos'],
  },
  {
    id: 'wellness',
    label: 'Deporte & Bienestar',
    subjects: ['Yoga', 'Meditación', 'Nutrición', 'Natación', 'Entrenamiento funcional', 'Pilates', 'Artes marciales'],
  },
  {
    id: 'humanities',
    label: 'Humanidades',
    subjects: ['Historia', 'Filosofía', 'Literatura', 'Geografía', 'Psicología', 'Sociología', 'Derecho', 'Redacción'],
  },
];

export const INTERESTS: string[] = COURSE_CATEGORIES.flatMap((c) => c.subjects);
