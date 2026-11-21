export const POLICY_THRESHOLDS = {
  // PD 1216: Dedicated park standard for residential subdivisions
  PD1216_PARK_PERCENT: 9.0, // 9% dedicated parks/playgrounds
  PD1216_GROSS_OPEN_SPACE_PERCENT: 30.0, // 30% gross open space for >= 1 ha
  
  // WHO Urban Green Target: 9.0 m² per capita
  // Under typical dense NCR urban density of ~20,000 people/km² (~7,200 people in 600m x 600m = 0.36 km²):
  // Required green area = 7,200 people * 9 m² = 64,800 m² (which is 18.0% of the 360,000 m² zone)
  WHO_TARGET_SQM_PER_CAPITA: 9.0,
  ASSUMED_ZONE_POPULATION: 7200,
  WHO_EQUIVALENT_PERCENT: 18.0,

  // Singapore Urban Greenery Target
  SINGAPORE_TARGET_PERCENT: 30.0,

  // Average weighted canopy height (m) to calculate m³ volume from m² footprint
  CANOPY_WEIGHTED_HEIGHT_METERS: 6.0,

  // Total inspection box area (600m x 600m) in m²
  INSPECTION_BOX_AREA_SQM: 360000,
  INSPECTION_BOX_SIZE_METERS: 600
};

export const RESILIENCE_TIERS = {
  CRITICAL: {
    key: 'CRITICAL',
    label: 'Critical Heat Risk',
    color: '#EF4444',
    badgeClass: 'bg-red-500/15 text-red-600 border border-red-500/30',
    description: 'High heat stress vulnerability. Severe deficit in microclimate cooling canopy.'
  },
  VULNERABLE: {
    key: 'VULNERABLE',
    label: 'Vulnerable',
    color: '#F59E0B',
    badgeClass: 'bg-amber-500/15 text-amber-600 border border-amber-500/30',
    description: 'Marginal canopy buffer. Rapid surface temperature escalation under dry spell.'
  },
  BUFFERED: {
    key: 'BUFFERED',
    label: 'Buffered',
    color: '#10B981',
    badgeClass: 'bg-emerald-500/15 text-emerald-600 border border-emerald-500/30',
    description: 'Balanced vegetative massing. Effectively dampens urban heat island effect.'
  },
  RESILIENT: {
    key: 'RESILIENT',
    label: 'Resilient Oasis',
    color: '#059669',
    badgeClass: 'bg-emerald-600/20 text-emerald-700 border border-emerald-600/40',
    description: 'Outstanding tree canopy volume. High microclimate drought & heat resilience.'
  }
};
