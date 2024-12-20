import { cloneDeep } from 'lodash';
import json from './defaultScoreRules.json';
import { parseScoreConfig, type RawScoreConfig, type ScoreConfig } from './parseScoreConfig';

export function getDefaultScoreCalculation(): ScoreConfig {
  return parseScoreConfig(cloneDeep(json));
}

export function getRawDefaultScoreCalculation(): RawScoreConfig {
  return cloneDeep(json);
}
