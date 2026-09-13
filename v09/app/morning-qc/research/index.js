/* v09/app/morning-qc/research/index.js — Stage 12E public exports, PROVENANCE: V09_NEW */
export { METRIC_REGISTRY_VERSION, METRIC_REGISTRY, getMetricDefinition, safeRatio, formatRatioForDisplay } from './metric-registry.js';
export { computeInstructorMetrics } from './instructor-metrics.js';
export { SYNTHETIC_FIXTURE_VERSION, buildSyntheticCohort, buildMalformedFixture } from './synthetic-fixtures.js';
export { EXPORT_SCHEMA_VERSION, APPLICATION_VERSION, buildResearchExportBundle } from './research-export.js';
export { DATA_DICTIONARY_VERSION, RESEARCH_DATA_DICTIONARY } from './data-dictionary.js';
