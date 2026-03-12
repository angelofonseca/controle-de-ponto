import { describe, it, expect } from 'vitest';
import {
  getTimeRecordLabel,
  getAttendanceStatusLabel,
  getNextTimeRecordType,
  formatMinutes,
} from '$lib/utils/index';

describe('getTimeRecordLabel', () => {
  it('should return "Entrada" for CLOCK_IN', () => {
    expect(getTimeRecordLabel('CLOCK_IN')).toBe('Entrada');
  });

  it('should return "Saída" for CLOCK_OUT', () => {
    expect(getTimeRecordLabel('CLOCK_OUT')).toBe('Saída');
  });

  it('should return "Início do Intervalo" for BREAK_START', () => {
    expect(getTimeRecordLabel('BREAK_START')).toBe('Início do Intervalo');
  });

  it('should return "Fim do Intervalo" for BREAK_END', () => {
    expect(getTimeRecordLabel('BREAK_END')).toBe('Fim do Intervalo');
  });
});

describe('getAttendanceStatusLabel', () => {
  it('should return "No Horário" for ON_TIME', () => {
    expect(getAttendanceStatusLabel('ON_TIME')).toBe('No Horário');
  });

  it('should return "Atrasado" for LATE', () => {
    expect(getAttendanceStatusLabel('LATE')).toBe('Atrasado');
  });

  it('should return "Falta" for ABSENT', () => {
    expect(getAttendanceStatusLabel('ABSENT')).toBe('Falta');
  });
});

describe('getNextTimeRecordType', () => {
  it('should return CLOCK_IN when no last type', () => {
    expect(getNextTimeRecordType(null)).toBe('CLOCK_IN');
  });

  it('should return BREAK_START after CLOCK_IN', () => {
    expect(getNextTimeRecordType('CLOCK_IN')).toBe('BREAK_START');
  });

  it('should return BREAK_END after BREAK_START', () => {
    expect(getNextTimeRecordType('BREAK_START')).toBe('BREAK_END');
  });

  it('should return CLOCK_OUT after BREAK_END', () => {
    expect(getNextTimeRecordType('BREAK_END')).toBe('CLOCK_OUT');
  });

  it('should return null after CLOCK_OUT', () => {
    expect(getNextTimeRecordType('CLOCK_OUT')).toBeNull();
  });
});

describe('formatMinutes', () => {
  it('should return "--" for null', () => {
    expect(formatMinutes(null)).toBe('--');
  });

  it('should format 90 minutes as 1h30min', () => {
    expect(formatMinutes(90)).toBe('1h30min');
  });

  it('should format 480 minutes as 8h00min', () => {
    expect(formatMinutes(480)).toBe('8h00min');
  });
});
