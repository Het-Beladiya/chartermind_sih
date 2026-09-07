// india_eastcoast_port_specs.csv
// Real NGA World Port Index (Pub.150) data for India East Coast Ports
export interface RealPortSpec {
  portName: string;
  channelDepthM: number;
  anchorageDepthM: number;
  cargoPierDepthM: number;
  maxVesselLoaM: number;
  maxVesselBeamM: number;
  maxVesselDraftM: number;
  harborSize: string;
  harborType: string;
  pilotageCompulsory: string;
  solidBulkFacilities: string;
  latitude: number;
  longitude: number;
}

export const REAL_INDIA_PORT_SPECS: Record<string, RealPortSpec> = {
  Dhamra: {
    portName: 'Dhamra',
    channelDepthM: 17.0,
    anchorageDepthM: 0.0,
    cargoPierDepthM: 19.0,
    maxVesselLoaM: 350.0,
    maxVesselBeamM: 50.0,
    maxVesselDraftM: 19.0,
    harborSize: 'Large',
    harborType: 'Coastal (Natural/Engineered)',
    pilotageCompulsory: 'Yes',
    solidBulkFacilities: 'Mechanized Bulk Berth',
    latitude: 20.81666667,
    longitude: 86.96666667,
  },
  Kolkata: {
    portName: 'Kolkata',
    channelDepthM: 7.9,
    anchorageDepthM: 9.4,
    cargoPierDepthM: 9.5,
    maxVesselLoaM: 171.9,
    maxVesselBeamM: 25.0,
    maxVesselDraftM: 6.8,
    harborSize: 'Large',
    harborType: 'River (Natural)',
    pilotageCompulsory: 'Yes',
    solidBulkFacilities: 'Semi-Mechanized',
    latitude: 22.55,
    longitude: 88.333333,
  },
  Haldia: {
    portName: 'Haldia',
    channelDepthM: 7.9,
    anchorageDepthM: 11.0,
    cargoPierDepthM: 12.5,
    maxVesselLoaM: 177.0,
    maxVesselBeamM: 44.0,
    maxVesselDraftM: 8.5,
    harborSize: 'Very Small',
    harborType: 'River (Natural)',
    pilotageCompulsory: 'Yes',
    solidBulkFacilities: 'Lock-Gate Bulk Berths',
    latitude: 22.016667,
    longitude: 88.083333,
  },
  Chennai: {
    portName: 'Chennai',
    channelDepthM: 18.6,
    anchorageDepthM: 15.5,
    cargoPierDepthM: 15.0,
    maxVesselLoaM: 336.7,
    maxVesselBeamM: 60.0,
    maxVesselDraftM: 16.5,
    harborSize: 'Large',
    harborType: 'Coastal (Breakwater)',
    pilotageCompulsory: 'Yes',
    solidBulkFacilities: 'Bulk & General Cargo',
    latitude: 13.1,
    longitude: 80.3,
  },
  Vizag: {
    portName: 'Vizag',
    channelDepthM: 17.1,
    anchorageDepthM: 3.4,
    cargoPierDepthM: 16.5,
    maxVesselLoaM: 320.0,
    maxVesselBeamM: 50.0,
    maxVesselDraftM: 18.1,
    harborSize: 'Medium',
    harborType: 'Coastal (Breakwater)',
    pilotageCompulsory: 'Yes',
    solidBulkFacilities: 'Outer Harbor VGCB Mechanized',
    latitude: 17.683333,
    longitude: 83.3,
  },
  Paradip: {
    portName: 'Paradip',
    channelDepthM: 12.5,
    anchorageDepthM: 9.4,
    cargoPierDepthM: 17.1,
    maxVesselLoaM: 295.0,
    maxVesselBeamM: 46.0,
    maxVesselDraftM: 14.5,
    harborSize: 'Small',
    harborType: 'Coastal (Breakwater)',
    pilotageCompulsory: 'Yes',
    solidBulkFacilities: 'Mechanized Coal/Ore Berths (MCHP)',
    latitude: 20.266667,
    longitude: 86.683333,
  },
  Kamarajar: {
    portName: 'Kamarajar',
    channelDepthM: 15.5,
    anchorageDepthM: 15.5,
    cargoPierDepthM: 15.0,
    maxVesselLoaM: 365.9,
    maxVesselBeamM: 48.2,
    maxVesselDraftM: 15.0,
    harborSize: 'Small',
    harborType: 'Coastal (Breakwater)',
    pilotageCompulsory: 'Yes',
    solidBulkFacilities: 'Coal & Ore Terminals',
    latitude: 13.26138889,
    longitude: 80.3425,
  },
};
