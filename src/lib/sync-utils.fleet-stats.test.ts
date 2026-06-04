import { describe, it, expect } from 'vitest';
import {
  countRemorquesForFleetStats,
  countTracteursJumeles,
  truckHasJumeleRemorque,
} from '@/lib/sync-utils';
import type { Truck } from '@/contexts/AppContext';

describe('countRemorquesForFleetStats', () => {
  it('compte les fiches remorqueuse + les tracteurs jumelés', () => {
    const trucks = [
      { type: 'tracteur', sousType: 'tracteur_seul' as const },
      { type: 'tracteur', sousType: 'tracteur_jumele' as const, remorqueImmatriculation: 'R1' },
      { type: 'remorqueuse' as const, sousType: 'remorque_seule' as const },
      { type: 'remorqueuse' as const, sousType: 'remorque_seule' as const },
    ] as Pick<Truck, 'type' | 'sousType' | 'remorqueImmatriculation'>[];
    expect(countTracteursJumeles(trucks)).toBe(1);
    expect(countRemorquesForFleetStats(trucks)).toBe(3);
  });

  it('tracteur seul avec plaque remorque (inféré jumelé) compte une remorque', () => {
    const trucks = [
      { type: 'tracteur', sousType: 'tracteur_seul' as const, remorqueImmatriculation: 'XY' },
    ] as Pick<Truck, 'type' | 'sousType' | 'remorqueImmatriculation'>[];
    expect(truckHasJumeleRemorque(trucks[0])).toBe(true);
    expect(countRemorquesForFleetStats(trucks)).toBe(1);
  });
});
