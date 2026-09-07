// vessel_class_rate_ratio_reference.csv
// Handysize: 0.282, Supramax: 0.489, Panamax: 0.605, Capesize: 1.0
import { VesselClassId } from '../types';

export interface VesselClassRatio {
  vesselClass: VesselClassId;
  indexName: string;
  avgRatioToCapesize: number;
}

export const VESSEL_CLASS_RATIOS: Record<VesselClassId, VesselClassRatio> = {
  capesize: {
    vesselClass: 'capesize',
    indexName: 'Capesize_Index',
    avgRatioToCapesize: 1.0,
  },
  panamax: {
    vesselClass: 'panamax',
    indexName: 'Panamax_Index',
    avgRatioToCapesize: 0.605,
  },
  supramax: {
    vesselClass: 'supramax',
    indexName: 'Supramax_Index',
    avgRatioToCapesize: 0.489,
  },
  handysize: {
    vesselClass: 'handysize',
    indexName: 'Handysize_Index',
    avgRatioToCapesize: 0.282,
  },
};
