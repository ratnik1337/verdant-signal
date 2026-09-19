const LEVELS = [
  { level: 1, title: 'New arrival', requiredActiveDays: 0, bonusMinor: 0, description: 'Your workspace is ready for its first signal.' },
  { level: 2, title: 'First trace', requiredActiveDays: 1, bonusMinor: 0, description: 'One verified calendar day of activity.' },
  { level: 3, title: 'Pattern scout', requiredActiveDays: 7, bonusMinor: 1000, description: 'A week of separate active days.' },
  { level: 4, title: 'Round reader', requiredActiveDays: 30, bonusMinor: 2500, description: 'A month of measured observation.' },
  { level: 5, title: 'Signal keeper', requiredActiveDays: 60, bonusMinor: 5000, description: 'Two months of consistent observation.' },
  { level: 6, title: 'Long view', requiredActiveDays: 90, bonusMinor: 10000, description: 'Ninety active days unlock the demo withdrawal review.' },
];

const ACCURACY_TIERS = [
  { tier: 1, accuracy: 83, title: 'Basic', requiredActiveDays: 0, description: 'Standard signal accuracy' },
  { tier: 2, accuracy: 91, title: 'Advanced', requiredActiveDays: 7, description: 'Unlocked after one week of activity' },
  { tier: 3, accuracy: 95, title: 'Pro', requiredActiveDays: 30, description: 'Unlocked after one month of activity' },
  { tier: 4, accuracy: 99, title: 'Elite', requiredActiveDays: 90, description: 'Unlocked after ninety active days' },
];

module.exports = { LEVELS, ACCURACY_TIERS };
