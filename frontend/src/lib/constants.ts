export const PROCESS_TYPES = [
  'Machining', 'CNC Turning', 'CNC Milling', 'Assembly', 'Welding',
  'Painting/Coating', 'Inspection/QC', 'Material Handling',
  'Heat Treatment', 'Forming/Pressing', 'Grinding', 'Other',
];

export const SYMPTOM_OPTIONS = [
  // Dimensional
  { id: 'dim-out-of-spec', label: 'Dimension out of spec', category: 'Dimensional' },
  { id: 'dim-incorrect-size', label: 'Incorrect size/shape', category: 'Dimensional' },
  { id: 'dim-tolerance', label: 'Tolerance exceeded', category: 'Dimensional' },
  // Surface
  { id: 'surf-scratches', label: 'Scratches/marks', category: 'Surface Quality' },
  { id: 'surf-burrs', label: 'Burrs/sharp edges', category: 'Surface Quality' },
  { id: 'surf-finish', label: 'Poor surface finish', category: 'Surface Quality' },
  { id: 'surf-corrosion', label: 'Corrosion/rust', category: 'Surface Quality' },
  // Structural
  { id: 'struct-crack', label: 'Crack/fracture', category: 'Structural' },
  { id: 'struct-deform', label: 'Deformation/warping', category: 'Structural' },
  { id: 'struct-break', label: 'Part breakage', category: 'Structural' },
  // Functional
  { id: 'func-no-work', label: 'Not functioning', category: 'Functional' },
  { id: 'func-intermittent', label: 'Intermittent failure', category: 'Functional' },
  { id: 'func-vibration', label: 'Excessive vibration', category: 'Functional' },
  { id: 'func-noise', label: 'Abnormal noise', category: 'Functional' },
  // Process
  { id: 'proc-scrap', label: 'Excessive scrap', category: 'Process' },
  { id: 'proc-yield', label: 'Low yield/output', category: 'Process' },
  { id: 'proc-cycle', label: 'Increased cycle time', category: 'Process' },
  // Equipment
  { id: 'equip-overheat', label: 'Overheating', category: 'Equipment' },
  { id: 'equip-wear', label: 'Excessive wear', category: 'Equipment' },
  { id: 'equip-align', label: 'Misalignment', category: 'Equipment' },
];

export const CAUSE_CATEGORIES = [
  {
    id: 'Material',
    label: 'Material',
    icon: '📦',
    color: 'bg-amber-100 text-amber-800 border-amber-200',
    causes: [
      'Raw material defect',
      'Wrong material grade',
      'Material contamination',
      'Incorrect material hardness',
      'Storage/handling damage',
      'Material batch variation',
      'Incorrect material dimensions',
    ],
  },
  {
    id: 'Machine',
    label: 'Machine',
    icon: '⚙️',
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    causes: [
      'Worn/damaged tooling',
      'Machine misalignment',
      'Machine malfunction',
      'Poor calibration',
      'Lack of maintenance',
      'Excessive machine wear',
      'Software/control issue',
      'Fixture/workholding failure',
    ],
  },
  {
    id: 'Method',
    label: 'Method',
    icon: '📋',
    color: 'bg-green-100 text-green-800 border-green-200',
    causes: [
      'Incorrect work instruction',
      'Missing/outdated procedure',
      'Process deviation',
      'Wrong sequence of operations',
      'Insufficient process controls',
      'Setup error',
    ],
  },
  {
    id: 'Measurement',
    label: 'Measurement',
    icon: '📏',
    color: 'bg-purple-100 text-purple-800 border-purple-200',
    causes: [
      'Wrong measurement tool',
      'Measurement error',
      'Gauge calibration issue',
      'Incorrect measurement method',
      'Gage repeatability issue',
    ],
  },
  {
    id: 'Operator',
    label: 'Operator',
    icon: '👷',
    color: 'bg-orange-100 text-orange-800 border-orange-200',
    causes: [
      'Incorrect setup',
      'Lack of training',
      'Human error',
      'Fatigue/distraction',
      'Communication error',
      'Did not follow procedure',
    ],
  },
  {
    id: 'Environment',
    label: 'Environment',
    icon: '🌡️',
    color: 'bg-teal-100 text-teal-800 border-teal-200',
    causes: [
      'Temperature variation',
      'Humidity issue',
      'Vibration from nearby equipment',
      'Contamination/cleanliness',
      'Lighting issue',
      'Noise/distraction',
    ],
  },
];

export const SEVERITY_OPTIONS = [
  { value: 'low', label: 'Low', color: 'text-green-600', bg: 'bg-green-100' },
  { value: 'medium', label: 'Medium', color: 'text-yellow-600', bg: 'bg-yellow-100' },
  { value: 'high', label: 'High', color: 'text-orange-600', bg: 'bg-orange-100' },
  { value: 'critical', label: 'Critical', color: 'text-red-600', bg: 'bg-red-100' },
];

export const STATUS_OPTIONS = [
  { value: 'OPEN', label: 'Open', color: 'text-red-600', bg: 'bg-red-100' },
  { value: 'IN_PROGRESS', label: 'In Progress', color: 'text-yellow-600', bg: 'bg-yellow-100' },
  { value: 'RESOLVED', label: 'Resolved', color: 'text-green-600', bg: 'bg-green-100' },
];

export const ROLE_OPTIONS = [
  { value: 'OPERATOR', label: 'Operator' },
  { value: 'ENGINEER', label: 'Engineer' },
  { value: 'MAINTENANCE', label: 'Maintenance Technician' },
  { value: 'MANAGER', label: 'Manager' },
];

export const TOOL_TYPES = [
  'Cutting Insert', 'End Mill', 'Drill', 'Tap', 'Reamer', 'Boring Bar',
  'Face Mill', 'Thread Mill', 'Grinding Wheel', 'Weld Wire', 'Other',
];
