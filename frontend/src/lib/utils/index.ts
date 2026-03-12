import type { TimeRecordType, AttendanceStatus } from '$lib/types';

export function formatDate(date: string | Date): string {
  const d = new Date(date);
  return d.toLocaleDateString('pt-BR');
}

export function formatDateTime(date: string | Date): string {
  const d = new Date(date);
  return d.toLocaleString('pt-BR');
}

export function formatTime(date: string | Date): string {
  const d = new Date(date);
  return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

export function formatMinutes(minutes: number | null | undefined): string {
  if (minutes == null) return '--';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h${m.toString().padStart(2, '0')}min`;
}

export function getTimeRecordLabel(type: TimeRecordType): string {
  const labels: Record<TimeRecordType, string> = {
    CLOCK_IN: 'Entrada',
    BREAK_START: 'Início do Intervalo',
    BREAK_END: 'Fim do Intervalo',
    CLOCK_OUT: 'Saída',
  };
  return labels[type] || type;
}

export function getAttendanceStatusLabel(status: AttendanceStatus): string {
  const labels: Record<AttendanceStatus, string> = {
    ON_TIME: 'No Horário',
    LATE: 'Atrasado',
    ABSENT: 'Falta',
    IN_PROGRESS: 'Em Andamento',
    COMPLETED: 'Concluído',
    INCONSISTENT: 'Inconsistente',
  };
  return labels[status] || status;
}

export function getAttendanceStatusClass(status: AttendanceStatus): string {
  const classes: Record<AttendanceStatus, string> = {
    ON_TIME: 'badge-success',
    LATE: 'badge-warning',
    ABSENT: 'badge-danger',
    IN_PROGRESS: 'badge-info',
    COMPLETED: 'badge-success',
    INCONSISTENT: 'badge-danger',
  };
  return classes[status] || 'badge-gray';
}

export function getNextTimeRecordType(lastType: TimeRecordType | null): TimeRecordType | null {
  const sequence: TimeRecordType[] = ['CLOCK_IN', 'BREAK_START', 'BREAK_END', 'CLOCK_OUT'];

  if (!lastType) return 'CLOCK_IN';

  const currentIndex = sequence.indexOf(lastType);

  if (currentIndex === sequence.length - 1) return null;

  return sequence[currentIndex + 1];
}

export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}
