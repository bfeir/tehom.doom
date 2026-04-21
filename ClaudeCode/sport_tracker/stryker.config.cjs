/** @type {import('@stryker-mutator/core').PartialStrykerOptions} */
module.exports = {
  testRunner: 'vitest',
  coverageAnalysis: 'perTest',
  vitest: {
    configFile: 'vitest.config.ts',
  },
  mutate: [
    'src/services/PlateauDetector.ts',
    'src/services/HistoryService.ts',
  ],
  reporters: ['progress', 'json'],
  jsonReporter: { fileName: 'docs/feature/calisthenics-tracker-v1/deliver/mutation/report.json' },
  timeoutMS: 30000,
  thresholds: { high: 80, low: 70, break: 60 },
};
