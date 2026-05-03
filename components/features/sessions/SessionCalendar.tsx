import { useMemo } from 'react';
import { Calendar } from 'react-native-calendars';
import { BookingStatus, toLocalDateString } from './SessionCard';

/** Minimum shape required by SessionCalendar — works for both learner and tutor bookings. */
export interface CalendarBooking {
  startTime: string;
  status: BookingStatus;
}

/**
 * Monthly calendar that marks days containing sessions with colored dots.
 *
 * - Amber dot  → pending session
 * - Green dot  → confirmed session
 * - Gray dot   → completed or cancelled session
 *
 * @author Camilo Quintero, Jesús Pinzón, Laura Rodríguez, Santiago Díaz, Sergio Bejarano
 * @version 1.0
 * @since 2026-05-03
 */

interface Dot {
  key: string;
  color: string;
}

const STATUS_DOTS: Record<BookingStatus, Dot> = {
  pending:   { key: 'pending',   color: '#d97706' }, // amber  — needs attention
  confirmed: { key: 'confirmed', color: '#16a34a' }, // green  — upcoming confirmed
  completed: { key: 'completed', color: '#2563eb' }, // blue   — historical success
  cancelled: { key: 'cancelled', color: '#dc2626' }, // red    — cancelled or rejected
};

interface MarkedDay {
  dots: Dot[];
  selected?: boolean;
  selectedColor?: string;
}

interface SessionCalendarProps {
  bookings: CalendarBooking[];
  selectedDate: string | null;
  onDayPress: (dateString: string) => void;
}

export function SessionCalendar({ bookings, selectedDate, onDayPress }: SessionCalendarProps) {
  const markedDates = useMemo(() => {
    const result: Record<string, MarkedDay> = {};

    for (const b of bookings) {
      const key = toLocalDateString(b.startTime);
      if (!result[key]) result[key] = { dots: [] };

      const dot = STATUS_DOTS[b.status];
      if (dot && !result[key].dots.find((d) => d.key === dot.key)) {
        result[key].dots.push(dot);
      }
    }

    if (selectedDate) {
      result[selectedDate] = {
        dots: result[selectedDate]?.dots ?? [],
        selected: true,
        selectedColor: '#006A75',
      };
    }

    return result;
  }, [bookings, selectedDate]);

  return (
    <Calendar
      markingType="multi-dot"
      markedDates={markedDates}
      onDayPress={(day) => onDayPress(day.dateString)}
      theme={{
        todayTextColor: '#006A75',
        selectedDayBackgroundColor: '#006A75',
        selectedDayTextColor: '#ffffff',
        arrowColor: '#006A75',
        monthTextColor: '#1e293b',
        textDayFontSize: 14,
        textMonthFontSize: 15,
        textMonthFontWeight: '600',
        textDayHeaderFontSize: 12,
        dayTextColor: '#334155',
        textDisabledColor: '#CBD5E1',
        backgroundColor: '#ffffff',
        calendarBackground: '#ffffff',
      }}
    />
  );
}
