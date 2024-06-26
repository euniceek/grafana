import { PromQuery } from 'app/plugins/datasource/prometheus/types';

import { VAR_FILTERS_EXPR, VAR_GROUP_BY_EXP, VAR_METRIC_EXPR } from '../../shared';
import { heatmapGraphBuilder } from '../graph-builders/heatmap';
import { percentilesGraphBuilder } from '../graph-builders/percentiles';
import { simpleGraphBuilder } from '../graph-builders/simple';
import { AutoQueryDef } from '../types';
import { getUnit } from '../units';

export function createHistogramQueryDefs(metricParts: string[]) {
  const title = `${VAR_METRIC_EXPR}`;

  const unitSuffix = metricParts.at(-2);

  const unit = getUnit(unitSuffix);

  const common = {
    title,
    unit,
  };

  const p50: AutoQueryDef = {
    ...common,
    variant: 'p50',
    queries: [percentileQuery(50)],
    vizBuilder: () => simpleGraphBuilder(p50),
  };

  const breakdown: AutoQueryDef = {
    ...common,
    variant: 'p50',
    queries: [percentileQuery(50, [VAR_GROUP_BY_EXP])],
    vizBuilder: () => simpleGraphBuilder(breakdown),
  };

  const percentiles: AutoQueryDef = {
    ...common,
    variant: 'percentiles',
    queries: [99, 90, 50].map((p) => percentileQuery(p)),
    vizBuilder: () => percentilesGraphBuilder(percentiles),
  };

  const heatmap: AutoQueryDef = {
    ...common,
    variant: 'heatmap',
    queries: [heatMapQuery()],
    vizBuilder: () => heatmapGraphBuilder(heatmap),
  };

  return { preview: p50, main: percentiles, variants: [percentiles, heatmap], breakdown: breakdown };
}

const BASE_QUERY = `rate(${VAR_METRIC_EXPR}${VAR_FILTERS_EXPR}[$__rate_interval])`;

function baseQuery(groupings: string[] = []) {
  const sumByList = ['le', ...groupings];
  return `sum by(${sumByList.join(', ')}) (${BASE_QUERY})`;
}

function heatMapQuery(groupings: string[] = []): PromQuery {
  return {
    refId: 'Heatmap',
    expr: baseQuery(groupings),
    format: 'heatmap',
  };
}

function percentileQuery(percentile: number, groupings: string[] = []) {
  const percent = percentile / 100;

  return {
    refId: `Percentile${percentile}`,
    expr: `histogram_quantile(${percent}, ${baseQuery(groupings)})`,
    legendFormat: `${percentile}th Percentile`,
  };
}
