import { Ionicons } from '@expo/vector-icons';

// ── Category icons ────────────────────────────────────────────────────────────

const CATEGORY_ICON_MAP: Record<string, keyof typeof Ionicons.glyphMap> = {
  sciences:   'flask-outline',
  tech:       'code-slash-outline',
  languages:  'globe-outline',
  gastronomy: 'restaurant-outline',
  arts:       'color-palette-outline',
  business:   'trending-up-outline',
  wellness:   'barbell-outline',
  humanities: 'book-outline',
};

/**
 * Renders the Ionicons icon associated with a course category id.
 *
 * @author TutorConnect Team
 */
export function CategoryIcon({
  id,
  size = 20,
  color = '#006A75',
}: {
  id: string;
  size?: number;
  color?: string;
}) {
  const name = CATEGORY_ICON_MAP[id] ?? 'book-outline';
  return <Ionicons name={name} size={size} color={color} />;
}

// ── Student-type icons ────────────────────────────────────────────────────────

const STUDENT_TYPE_ICON_MAP: Record<string, keyof typeof Ionicons.glyphMap> = {
  universitario: 'school-outline',
  colegial:      'people-outline',
  profesional:   'briefcase-outline',
  otro:          'star-outline',
};

/**
 * Renders the Ionicons icon associated with a student type.
 *
 * @author TutorConnect Team
 */
export function StudentTypeIcon({
  type,
  size = 24,
  color = '#006A75',
}: {
  type: string;
  size?: number;
  color?: string;
}) {
  const name = STUDENT_TYPE_ICON_MAP[type] ?? 'star-outline';
  return <Ionicons name={name} size={size} color={color} />;
}
