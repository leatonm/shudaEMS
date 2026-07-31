/**
 * Official UP / AC protocol labels — single source of truth.
 * Update these with your real protocol numbers; JSON files stay in sync via dataLoader.
 */
export const PROTOCOL_CODES: Record<string, string> = {
  // —— 9 core generator conditions ——
  sepsis: 'UP15 Suspected Sepsis',
  chf: 'UP12 Cardiac Pulmonary Edema',
  respiratory: 'UP08 Bronchospasm',
  seizure: 'UP04 Seizure / Withdrawal',
  stemi: 'UP11 Chest Pain / STEMI',
  stroke: 'UP14 Suspected Stroke',
  anaphylaxis: 'AM1 Allergic Reaction / Anaphylaxis',
  monomorphic_vt: 'AC7 Adult Monomorphic Tachycardia Wide',
  torsades: 'AC8 Adult Polymorphic Tachycardia Wide Torsades de Pointes',

  // —— static trap / differential protocols ——
  hypoglycemia: 'UP03 Altered Mental Status / Hypoglycemia',
  angina: 'UP11 Chest Pain — Non-STEMI',
  cardiogenic_shock: 'UP12 / Shock Protocol',
  pulmonary_embolism: 'UP11 Chest Pain — PE Suspicion',
  eclampsia: 'UP Obstetric Emergency',
};

/** Protocol IDs that still need your official UP/AC code pasted in above. */
export const MISSING_PROTOCOL_CODES = Object.entries(PROTOCOL_CODES)
  .filter(([, code]) => !code.trim())
  .map(([id]) => id);

export function getProtocolCode(protocolId: string, fallback = ''): string {
  const code = PROTOCOL_CODES[protocolId]?.trim();
  if (code) return code;
  return fallback || protocolId;
}

export function applyProtocolCode<T extends { id: string; protocolCode: string }>(protocol: T): T {
  const code = getProtocolCode(protocol.id, protocol.protocolCode);
  return { ...protocol, protocolCode: code };
}
