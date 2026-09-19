const LEVELS = [
  { level: 1, title: 'New arrival', requiredActiveDays: 0, bonusMinor: 0, description: 'Your workspace is ready for its first signal.' },
  { level: 2, title: 'First trace', requiredActiveDays: 1, bonusMinor: 0, description: 'One verified calendar day of activity.' },
  { level: 3, title: 'Pattern scout', requiredActiveDays: 7, bonusMinor: 1000, description: 'A week of separate active days.' },
  { level: 4, title: 'Round reader', requiredActiveDays: 30, bonusMinor: 2500, description: 'A month of measured observation.' },
  { level: 5, title: 'Signal keeper', requiredActiveDays: 60, bonusMinor: 5000, description: 'Two months of consistent observation.' },
  { level: 6, title: 'Long view', requiredActiveDays: 90, bonusMinor: 10000, description: 'Ninety active days unlock the demo withdrawal review.' },
];

module.exports = { LEVELS };
