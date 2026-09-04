import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { api, clearApiCache } from '../services/api';

export interface CanonicalVessel {
  id: string;
  name: string;
  mmsi: string | number;
  imo: string | number;
  flag: string;
  country: string;
  operator: string;
  polar_class: string;
  latitude: number;
  longitude: number;
  sog: number;
  speed: number;
  cog: number;
  heading: number;
  nav_status?: string;
  source: 'DETERMINISTIC_SIMULATION' | 'AIS' | string;
  data_status: 'SIMULATED_VOYAGE' | 'LIVE' | string;
  is_demo?: boolean;
  destination_station_id?: string;
  destination: string;
  dest_lat?: number;
  dest_lon?: number;
  voyage_origin?: string;
  mission_description?: string;
  mission?: string;
  eta?: string;
  track?: [number, number][];
}

export interface RouteOption {
  id: string;
  name: string;
  vessel_id?: string;
  distance: number;
  eta: string;
  iceRisk?: string;
  icebergRisk?: string;
  weatherRisk?: string;
  overallScore?: number;
  recommended?: boolean;
  rioScore?: string | number;
  sicExposure?: number;
  reason?: string;
  decision_explanation?: string;
  fuelConsumption?: string | number;
  fuelSavings?: string;
  safetyMargin?: string;
  icebergEncounters?: number;
  costs?: Record<string, number>;
  cost_breakdown?: Record<string, number>;
  has_iceberg_hazard?: boolean;
  iceberg_threat?: any;
  path: [number, number][];
  waypoints?: any[];
}

// Authoritative Canonical Polar Fleet (Fallback & Offline Dataset)
export const CANONICAL_FLEET: CanonicalVessel[] = [
  {
    id: 'rv_sagar_nidhi',
    name: 'R/V Sagar Nidhi — DEMO',
    flag: '🇮🇳',
    country: 'India',
    operator: 'National Centre for Polar and Ocean Research (NCPOR)',
    mmsi: '419071000',
    imo: '9407988',
    latitude: -54.2000,
    longitude: 68.4000,
    sog: 13.5,
    speed: 13.5,
    cog: 165.0,
    heading: 165,
    nav_status: 'Underway using engine',
    source: 'DETERMINISTIC_SIMULATION',
    data_status: 'SIMULATED_VOYAGE',
    is_demo: true,
    destination_station_id: 'bharati',
    destination: 'Bharati Research Station',
    dest_lat: -69.4068,
    dest_lon: 76.1953,
    polar_class: 'PC5 / Ice Class 1A Super',
    voyage_origin: 'Mormugao Port / Cape Town',
    mission_description: '43rd Indian Scientific Expedition oceanographic transect and resupply towards Larsemann Hills.',
    eta: '72h 36m'
  },
  {
    id: 'rv_polarstern',
    name: 'R/V Polarstern — DEMO',
    flag: '🇩🇪',
    country: 'Germany',
    operator: 'Alfred Wegener Institute (AWI)',
    mmsi: '211281000',
    imo: '7820497',
    latitude: -69.2000,
    longitude: -8.3000,
    sog: 14.5,
    speed: 14.5,
    cog: 210.0,
    heading: 210,
    nav_status: 'Underway using engine',
    source: 'DETERMINISTIC_SIMULATION',
    data_status: 'SIMULATED_VOYAGE',
    is_demo: true,
    destination_station_id: 'neumayer_iii',
    destination: 'Neumayer Station III',
    dest_lat: -70.6744,
    dest_lon: -8.2742,
    polar_class: 'PC2 / Arc4 (Heavy Polar Icebreaker)',
    voyage_origin: 'Cape Town Port (South Africa)',
    mission_description: 'Weddell Sea continental shelf glaciology and Neumayer III annual observatory crew rotation.',
    eta: '11h 33m'
  },
  {
    id: 'rrs_sir_david_attenborough',
    name: 'RRS Sir David Attenborough — DEMO',
    flag: '🇬🇧',
    country: 'United Kingdom',
    operator: 'British Antarctic Survey (BAS)',
    mmsi: '232029054',
    imo: '9798222',
    latitude: -63.1000,
    longitude: -58.4000,
    sog: 14.8,
    speed: 14.8,
    cog: 224.0,
    heading: 224,
    nav_status: 'Underway using engine',
    source: 'DETERMINISTIC_SIMULATION',
    data_status: 'SIMULATED_VOYAGE',
    is_demo: true,
    destination_station_id: 'palmer',
    destination: 'Palmer Station',
    dest_lat: -64.7744,
    dest_lon: -64.0531,
    polar_class: 'PC4 (Polar Logistics & Science)',
    voyage_origin: 'Stanley Gateway Port',
    mission_description: 'Adelaide & Anvers Island marine geophysics and Palmer Station science passage via Gerlache Strait.',
    eta: '14h 20m'
  },
  {
    id: 'aurora_australis_2015_16',
    name: 'R/V Aurora Australis — DEMO',
    flag: '🇦🇺',
    country: 'Australia',
    operator: 'Australian Antarctic Division (AAD)',
    mmsi: '503000000',
    imo: '8712582',
    latitude: -65.2000,
    longitude: 64.3000,
    sog: 12.4,
    speed: 12.4,
    cog: 184.0,
    heading: 184,
    nav_status: 'Underway using engine',
    source: 'DETERMINISTIC_SIMULATION',
    data_status: 'SIMULATED_VOYAGE',
    is_demo: true,
    destination_station_id: 'davis',
    destination: 'Davis Station',
    dest_lat: -68.5764,
    dest_lon: 77.9672,
    polar_class: 'PC5 (Antarctic Research Vessel)',
    voyage_origin: 'Hobart Port (Tasmania)',
    mission_description: 'East Antarctic marine science transect approaching Vestfold Hills and Wilkes Land ice edge resupply.',
    eta: '26h 30m'
  },
  {
    id: 'sa_agulhas_ii',
    name: 'S.A. Agulhas II — DEMO',
    flag: '🇿🇦',
    country: 'South Africa',
    operator: 'Department of Forestry, Fisheries and the Environment (DFFE / SANAP)',
    mmsi: '601362000',
    imo: '9551131',
    latitude: -68.5000,
    longitude: -2.5000,
    sog: 12.8,
    speed: 12.8,
    cog: 190.0,
    heading: 190,
    nav_status: 'Underway using engine',
    source: 'DETERMINISTIC_SIMULATION',
    data_status: 'SIMULATED_VOYAGE',
    is_demo: true,
    destination_station_id: 'sanae_iv',
    destination: 'SANAE IV Base',
    dest_lat: -71.6739,
    dest_lon: -2.8408,
    polar_class: 'PC5 / DNV ICE-10',
    voyage_origin: 'Cape Town Port (South Africa)',
    mission_description: 'Queen Maud Land annual relief voyage carrying cargo, fuel, and overwintering teams.',
    eta: '24h 50m'
  },
  {
    id: 'rv_nathaniel_palmer',
    name: 'R/V Nathaniel B. Palmer — DEMO',
    flag: '🇺🇸',
    country: 'United States',
    operator: 'US Antarctic Program Marine Logistics (USAP)',
    mmsi: '367000000',
    imo: '9007295',
    latitude: -71.5000,
    longitude: 176.2000,
    sog: 14.2,
    speed: 14.2,
    cog: 192.0,
    heading: 192,
    nav_status: 'Underway using engine',
    source: 'DETERMINISTIC_SIMULATION',
    data_status: 'SIMULATED_VOYAGE',
    is_demo: true,
    destination_station_id: 'mcmurdo',
    destination: 'McMurdo Station',
    dest_lat: -77.8460,
    dest_lon: 166.6681,
    polar_class: 'PC3 (Heavy Research Icebreaker)',
    voyage_origin: 'Lyttelton Port (New Zealand)',
    mission_description: 'Ross Sea ecosystem & polynya study and heavy icebreaker escort into McMurdo Sound.',
    eta: '22h 10m'
  },
  {
    id: 'rv_shirase',
    name: 'R/V Shirase (AGB-5003) — DEMO',
    flag: '🇯🇵',
    country: 'Japan',
    operator: 'Japan National Institute of Polar Research (NIPR)',
    mmsi: '431999000',
    imo: '9400000',
    latitude: -64.5000,
    longitude: 40.2000,
    sog: 15.0,
    speed: 15.0,
    cog: 175.0,
    heading: 175,
    nav_status: 'Underway using engine',
    source: 'DETERMINISTIC_SIMULATION',
    data_status: 'SIMULATED_VOYAGE',
    is_demo: true,
    destination_station_id: 'syowa',
    destination: 'Syowa Station',
    dest_lat: -69.0042,
    dest_lon: 39.5806,
    polar_class: 'PC2 (Heavy Military-Spec Polar Icebreaker)',
    voyage_origin: 'Fremantle (Australia)',
    mission_description: '65th JARE continental logistics and heavy ice penetration into Lützow-Holm Bay.',
    eta: '15h 45m'
  },
  {
    id: 'polar_research_vessel_demo',
    name: 'Polar Research Vessel — DEMO',
    flag: '🌐',
    country: 'International / COMNAP',
    operator: 'COMNAP Scientific Logistics',
    mmsi: '211281001',
    imo: '7820498',
    latitude: -62.8000,
    longitude: -59.5000,
    sog: 13.5,
    speed: 13.5,
    cog: 215.0,
    heading: 215,
    nav_status: 'Underway using engine',
    source: 'DETERMINISTIC_SIMULATION',
    data_status: 'SIMULATED_VOYAGE',
    is_demo: true,
    destination_station_id: 'comandante_ferraz',
    destination: 'Comandante Ferraz Antarctic Station',
    dest_lat: -62.0833,
    dest_lon: -58.3833,
    polar_class: 'PC3 (Polar Icebreaker)',
    voyage_origin: 'Bransfield Strait Operational Sector',
    mission_description: 'Environmental research and multi-station logistic transect across South Shetland Islands.',
    eta: '8h 15m'
  }
];

export interface AntarcticStation {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  region?: string;
  operator?: string;
  country?: string;
  coastal_access?: boolean;
}

export const CANONICAL_STATIONS: AntarcticStation[] = [
  { id: 'bharati', name: 'Bharati Station (Larsemann Hills)', latitude: -69.4068, longitude: 76.1953, region: 'East Antarctica', operator: 'NCPOR (India)', country: 'India', coastal_access: true },
  { id: 'maitri', name: 'Maitri Station (Schirmacher Oasis)', latitude: -70.7700, longitude: 11.7300, region: 'Queen Maud Land', operator: 'NCPOR (India)', country: 'India', coastal_access: true },
  { id: 'neumayer', name: 'Neumayer Station III (Atka Bay)', latitude: -70.6700, longitude: -8.2700, region: 'Weddell Sea Sector', operator: 'AWI (Germany)', country: 'Germany', coastal_access: true },
  { id: 'mcmurdo', name: 'McMurdo Station (Ross Island)', latitude: -77.8500, longitude: 166.6700, region: 'Ross Sea', operator: 'USAP (USA)', country: 'USA', coastal_access: true },
  { id: 'rothera', name: 'Rothera Research Station (Adelaide Island)', latitude: -67.5700, longitude: -68.1300, region: 'Antarctic Peninsula', operator: 'BAS (UK)', country: 'UK', coastal_access: true },
  { id: 'casey', name: 'Casey Station (Wilkes Land)', latitude: -66.2800, longitude: 110.5300, region: 'Wilkes Land', operator: 'AAD (Australia)', country: 'Australia', coastal_access: true },
  { id: 'davis', name: 'Davis Station (Vestfold Hills)', latitude: -68.5800, longitude: 77.9700, region: 'Prydz Bay Sector', operator: 'AAD (Australia)', country: 'Australia', coastal_access: true },
  { id: 'comandante_ferraz', name: 'Comandante Ferraz Station (King George Island)', latitude: -62.0833, longitude: -58.3833, region: 'South Shetland Islands', operator: 'PROANTAR (Brazil)', country: 'Brazil', coastal_access: true }
];

export type MissionType = 'RESEARCH' | 'SUPPLY' | 'EMERGENCY' | 'ICE_OBSERVATION';
export type OptimizationPriority = 'BALANCED' | 'SAFEST' | 'FASTEST' | 'FUEL';

interface FleetContextType {
  fleet: CanonicalVessel[];
  selectedVesselId: string;
  selectedVessel: CanonicalVessel;
  setSelectedVesselId: (id: string) => void;
  stations: AntarcticStation[];
  selectedDestinationId: string;
  selectedDestination: AntarcticStation;
  setSelectedDestinationId: (id: string) => void;
  missionId: string;
  missionType: MissionType;
  setMissionType: (type: MissionType) => void;
  optimizationPriority: OptimizationPriority;
  setOptimizationPriority: (p: OptimizationPriority) => void;
  selectedIcebergId: string | null;
  setSelectedIcebergId: (id: string | null) => void;
  routes: RouteOption[];
  activeRouteId: string;
  setActiveRouteId: (id: string) => void;
  activeRoute: RouteOption | null;
  emergencyRerouteActive: boolean;
  setEmergencyRerouteActive: (active: boolean) => void;
  tacticalAlert: {
    active: boolean;
    phase: 'idle' | 'detecting' | 'diverted';
    title?: string;
    description?: string;
    icebergId?: string;
    headingChange?: string;
    clearanceKm?: number;
    extraDistKm?: number;
    extraEtaMinutes?: number;
    alertId?: string;
    timestamp?: string;
    hazardIceberg?: any;
  };
  setTacticalAlert: React.Dispatch<React.SetStateAction<{
    active: boolean;
    phase: 'idle' | 'detecting' | 'diverted';
    title?: string;
    description?: string;
    icebergId?: string;
    headingChange?: string;
    clearanceKm?: number;
    extraDistKm?: number;
    extraEtaMinutes?: number;
    alertId?: string;
    timestamp?: string;
    hazardIceberg?: any;
  }>>;
  triggerEmergencyHazard: () => Promise<void>;
  dismissTacticalAlert: () => void;
  recomputeRoutes: () => Promise<void>;
  whatIfScenario: {
    active: boolean;
    icebergDriftOffsetKm: number;
    sicIncreasePct: number;
    windGustKnots: number;
  };
  setWhatIfScenario: React.Dispatch<React.SetStateAction<{
    active: boolean;
    icebergDriftOffsetKm: number;
    sicIncreasePct: number;
    windGustKnots: number;
  }>>;
  isLoading: boolean;
  isComputingRoutes: boolean;
  refreshFleet: () => Promise<void>;
  setCustomDestination: (name: string, latitude: number, longitude: number) => void;
}

const FleetContext = createContext<FleetContextType | undefined>(undefined);

const STORAGE_KEY = 'polarnav_selected_vessel_id';
const DEST_STORAGE_KEY = 'polarnav_selected_destination_id';
const MISSION_TYPE_KEY = 'polarnav_mission_type';

export const FleetProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [fleet, setFleet] = useState<CanonicalVessel[]>(CANONICAL_FLEET);
  const [stations, setStations] = useState<AntarcticStation[]>(CANONICAL_STATIONS);
  const [selectedVesselId, setSelectedVesselIdState] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEY) || 'rv_sagar_nidhi';
  });
  const [selectedDestinationId, setSelectedDestinationIdState] = useState<string>(() => {
    return localStorage.getItem(DEST_STORAGE_KEY) || 'bharati';
  });
  const [missionType, setMissionTypeState] = useState<MissionType>(() => {
    return (localStorage.getItem(MISSION_TYPE_KEY) as MissionType) || 'RESEARCH';
  });
  const [optimizationPriority, setOptimizationPriority] = useState<OptimizationPriority>('BALANCED');
  const [emergencyRerouteActive, setEmergencyRerouteActive] = useState<boolean>(false);
  const [isComputingRoutes, setIsComputingRoutes] = useState<boolean>(false);
  const [whatIfScenario, setWhatIfScenario] = useState({
    active: false,
    icebergDriftOffsetKm: 25.0,
    sicIncreasePct: 15.0,
    windGustKnots: 20.0
  });

  const [tacticalAlert, setTacticalAlert] = useState<{
    active: boolean;
    phase: 'idle' | 'detecting' | 'diverted';
    title?: string;
    description?: string;
    icebergId?: string;
    headingChange?: string;
    clearanceKm?: number;
    extraDistKm?: number;
    extraEtaMinutes?: number;
    alertId?: string;
    timestamp?: string;
    hazardIceberg?: any;
  }>({
    active: false,
    phase: 'idle'
  });

  const [selectedIcebergId, setSelectedIcebergId] = useState<string | null>(null);
  const [routes, setRoutes] = useState<RouteOption[]>([]);
  const [activeRouteId, setActiveRouteId] = useState<string>('route-b');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const routeCacheRef = useRef<Map<string, RouteOption[]>>(new Map());

  // Set selected vessel with persistence
  const setSelectedVesselId = useCallback((id: string) => {
    setSelectedVesselIdState(id);
    localStorage.setItem(STORAGE_KEY, id);
  }, []);

  // Set selected destination with persistence
  const setSelectedDestinationId = useCallback((id: string) => {
    setSelectedDestinationIdState(id);
    localStorage.setItem(DEST_STORAGE_KEY, id);
  }, []);

  // Dynamically register & navigate to a custom coordinate location
  const setCustomDestination = useCallback((name: string, latitude: number, longitude: number) => {
    const lat = Number(latitude);
    const lon = Number(longitude);
    if (isNaN(lat) || isNaN(lon)) return;
    const customId = `custom_${Date.now()}`;
    const customStation: AntarcticStation = {
      id: customId,
      name: name.trim() || `Custom Target (${Math.abs(lat).toFixed(2)}°${lat < 0 ? 'S' : 'N'}, ${Math.abs(lon).toFixed(2)}°${lon >= 0 ? 'E' : 'W'})`,
      latitude: lat,
      longitude: lon,
      region: 'Custom Waypoint Sector',
      country: 'Target Mooring',
      coastal_access: true
    };
    setStations(prev => [customStation, ...prev.filter(s => !s.id.startsWith('custom_'))]);
    setSelectedDestinationIdState(customId);
    localStorage.setItem(DEST_STORAGE_KEY, customId);
  }, []);

  const setMissionType = useCallback((type: MissionType) => {
    setMissionTypeState(type);
    localStorage.setItem(MISSION_TYPE_KEY, type);
  }, []);

  // Fetch live stations from backend, fallback to CANONICAL_STATIONS
  useEffect(() => {
    api.stations().then((res) => {
      if (res?.stations?.length) {
        const normalized: AntarcticStation[] = res.stations.map((s: any) => ({
          id: s.id || s.station_id || s.name?.toLowerCase().replace(/\s+/g, '_'),
          name: s.name || s.station_name,
          latitude: Number(s.latitude || s.lat),
          longitude: Number(s.longitude || s.lon),
          region: s.region || s.sub_region || '',
          operator: s.operator || s.country || '',
          country: s.country || '',
          coastal_access: s.coastal_access ?? true
        })).filter((s: AntarcticStation) => s.id && !isNaN(s.latitude) && !isNaN(s.longitude));
        if (normalized.length > 0) {
          setStations(normalized);
        }
      }
    }).catch(() => { /* keep CANONICAL_STATIONS as fallback */ });
  }, []);

  // Fetch canonical fleet from backend
  const refreshFleet = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await api.vessels();
      if (res?.vessels?.length) {
        const normalized: CanonicalVessel[] = res.vessels.map((v: any) => ({
          id: v.id || String(v.mmsi),
          name: v.name,
          mmsi: v.mmsi || '',
          imo: v.imo || '',
          flag: v.flag || '⚓',
          country: v.country || 'International',
          operator: v.operator || 'Polar Research Agency',
          polar_class: v.polar_class || v.polarClass || 'PC5',
          latitude: Number(v.latitude),
          longitude: Number(v.longitude),
          sog: Number(v.sog ?? v.speed ?? 13.5),
          speed: Number(v.speed ?? v.sog ?? 13.5),
          cog: Number(v.cog ?? v.heading ?? 180),
          heading: Number(v.heading ?? v.cog ?? 180),
          nav_status: v.nav_status || 'Underway using engine',
          source: v.source || 'DETERMINISTIC_SIMULATION',
          data_status: v.data_status || 'SIMULATED_VOYAGE',
          is_demo: v.is_demo !== undefined ? v.is_demo : true,
          destination_station_id: v.destination_station_id,
          destination: v.destination || v.destination_name || 'Antarctic Station',
          dest_lat: v.dest_lat !== undefined ? Number(v.dest_lat) : undefined,
          dest_lon: v.dest_lon !== undefined ? Number(v.dest_lon) : undefined,
          voyage_origin: v.voyage_origin || 'Polar Gateway Port',
          mission_description: v.mission_description || v.mission || '',
          eta: v.eta || 'Calculating...',
          track: v.track
        }));
        setFleet(normalized);
      }
    } catch (e) {
      console.warn('[FleetContext] Backend unavailable, using canonical offline fleet.', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshFleet();
  }, [refreshFleet]);

  // Derive active selected vessel
  const selectedVessel = useMemo(() => {
    return fleet.find(v => v.id === selectedVesselId || String(v.mmsi) === selectedVesselId) || fleet[0] || CANONICAL_FLEET[0];
  }, [fleet, selectedVesselId]);

  // Derive active selected destination
  const selectedDestination = useMemo(() => {
    return stations.find(s => s.id === selectedDestinationId) || stations[0] || CANONICAL_STATIONS[0];
  }, [stations, selectedDestinationId]);

  // Unified canonical mission ID
  const missionId = useMemo(() => {
    return `MIS-2026-${(selectedVessel?.id || 'VESSEL').replace(/[^a-zA-Z0-9]/g, '').toUpperCase()}`;
  }, [selectedVessel?.id]);

  // Dismiss tactical alert and restore nominal route
  const dismissTacticalAlert = useCallback(() => {
    setTacticalAlert({ active: false, phase: 'idle' });
    setEmergencyRerouteActive(false);
    clearApiCache('/routes');
    api.restore().catch(() => {});
    if (selectedVessel && selectedDestination) {
      const cacheKey = `${selectedVessel.id}_${selectedDestination.id}_em_${whatIfScenario.active ? 'whatif' : 'norm'}`;
      routeCacheRef.current.delete(cacheKey);
      const normKey = `${selectedVessel.id}_${selectedDestination.id}_norm_${whatIfScenario.active ? 'whatif' : 'norm'}`;
      if (routeCacheRef.current.has(normKey)) {
        setRoutes(routeCacheRef.current.get(normKey)!);
      } else {
        api.routes({
          vesselId: selectedVessel.id,
          destId: selectedDestination.id,
          destLat: selectedDestination.latitude,
          destLon: selectedDestination.longitude,
          destName: selectedDestination.name,
          emergency: false
        }).then((res) => {
          if (res?.routes?.length) {
            setRoutes(res.routes);
          }
        }).catch(() => {});
      }
    }
  }, [selectedVessel, selectedDestination, whatIfScenario.active]);

  // Trigger tactical emergency avoidance when iceberg hazard is detected
  const triggerEmergencyHazard = useCallback(async () => {
    if (emergencyRerouteActive) {
      // Toggle off / restore normal planned route
      setEmergencyRerouteActive(false);
      setTacticalAlert({ active: false, phase: 'idle' });
      return;
    }

    // Phase 1: Small on-screen alert banner for immediate warning
    setTacticalAlert({
      active: true,
      phase: 'detecting',
      title: 'SCANNING ROUTE FOR ICEBERG HAZARDS...',
      description: `Analyzing forward radar contacts and drift vectors along active corridor of ${selectedVessel.name}...`,
    });

    try {
      const res = await api.emergency({
        vessel_id: selectedVessel?.id,
        dest_id: selectedDestination?.id
      });

      if (res?.emergency && res.diverted_route && res.hazard_detected !== false) {
        setEmergencyRerouteActive(true);
        const hazId = res.iceberg_id || res.iceberg?.id || 'IB-A84';
        const hazName = res.iceberg_name || res.iceberg?.name || `Iceberg ${hazId}`;
        const cpa = res.cpa_km || res.iceberg?.cpa_km || 4.2;

        if (res.routes?.length) {
          const formatted: RouteOption[] = res.routes.map((r: any, idx: number) => ({
            id: r.id || (idx === 0 ? 'route-tactical' : idx === 1 ? 'route-b' : 'route-c'),
            name: r.name || (idx === 0 ? 'ROUTE B (TACTICAL BYPASS)' : 'ROUTE OPTION'),
            vessel_id: selectedVessel?.id,
            distance: typeof r.distance_km === 'number' ? r.distance_km : parseFloat(String(r.distance || '').replace(/[^0-9.]/g, '')) || 3817,
            eta: r.eta || '32h 45m',
            iceRisk: r.iceRisk || 'LOW (EVADED)',
            icebergRisk: 'SAFE (DIVERTED)',
            weatherRisk: r.weatherRisk || 'MODERATE',
            overallScore: r.overallScore || 94,
            recommended: r.recommended ?? (idx === 0),
            rioScore: r.rioScore ?? '+8.4',
            sicExposure: r.sicExposure ?? 22,
            reason: r.reason || 'Tactical iceberg evasion corridor.',
            decision_explanation: r.decision_explanation || r.reason,
            fuelConsumption: r.fuelConsumption || r.fuel_estimate || '106 MT',
            safetyMargin: 'VERIFIED',
            costs: r.costs || {},
            cost_breakdown: r.cost_breakdown || {},
            has_iceberg_hazard: true,
            iceberg_threat: res.iceberg,
            path: r.path || [],
            waypoints: r.waypoints || []
          }));
          const emCacheKey = `${selectedVessel.id}_${selectedDestination.id}_em_${whatIfScenario.active ? 'whatif' : 'norm'}`;
          routeCacheRef.current.set(emCacheKey, formatted);
          setRoutes(formatted);
          setActiveRouteId(res.diverted_route.id || formatted[0].id);
        }

        // Phase 2: Route optimized with small direction change & alert logged to DB
        setTacticalAlert({
          active: true,
          phase: 'diverted',
          title: `TACTICAL ICEBERG HAZARD IN ROUTE: ${hazId}`,
          description: `${hazName} detected drifting into transit corridor (${cpa} km CPA). Shifted heading +${res.heading_alteration_deg || 12}° Starboard (+${res.extra_distance_km || 17.5} km). 26.4 km safe CPA clearance secured. Registered in alerts.`,
          icebergId: hazId,
          headingChange: `+${res.heading_alteration_deg || 12}° Starboard`,
          clearanceKm: res.clearance_km || 26.4,
          extraDistKm: res.extra_distance_km || 17.5,
          extraEtaMinutes: res.extra_eta_minutes || 42,
          alertId: res.alert?.id,
          timestamp: 'Just now',
          hazardIceberg: res.iceberg
        });
      } else {
        // No iceberg detected in route
        setEmergencyRerouteActive(false);
        setTacticalAlert({
          active: true,
          phase: 'idle',
          title: 'ROUTE CORRIDOR CLEAR',
          description: `No iceberg collision hazards detected along active transit path of ${selectedVessel.name}. Nominal route maintained.`
        });
        setTimeout(() => {
          setTacticalAlert({ active: false, phase: 'idle' });
        }, 3500);
      }
    } catch (e) {
      console.error('Failed to trigger emergency hazard diversion:', e);
      setEmergencyRerouteActive(false);
    }
  }, [emergencyRerouteActive, selectedVessel, selectedDestination, whatIfScenario.active]);

  // Dynamic spherical fallback corridor generator (ensures routes compute instantly even under network/cold-start issues)
  const generateFallbackCorridors = useCallback((vessel: CanonicalVessel, dest: AntarcticStation): RouteOption[] => {
    const sLat = vessel.latitude;
    const sLon = vessel.longitude;
    const dLat = dest.latitude ?? (dest as any).lat ?? -69.41;
    const dLon = dest.longitude ?? (dest as any).lon ?? 76.19;

    let dLonArc = dLon - sLon;
    if (dLonArc > 180) dLonArc -= 360;
    else if (dLonArc < -180) dLonArc += 360;

    const nPts = 20;
    const pathA: [number, number][] = [];
    const pathB: [number, number][] = [];
    const pathC: [number, number][] = [];

    for (let i = 0; i < nPts; i++) {
      const t = i / (nPts - 1);
      let lonI = sLon + dLonArc * t;
      if (lonI > 180) lonI -= 360;
      else if (lonI < -180) lonI += 360;

      const baseLat = sLat + (dLat - sLat) * t;
      const arcB = Math.sin(t * Math.PI) * 2.2;
      const arcC = Math.sin(t * Math.PI) * 4.5;

      pathA.push([Number(baseLat.toFixed(4)), Number(lonI.toFixed(4))]);
      pathB.push([Number((baseLat + arcB).toFixed(4)), Number(lonI.toFixed(4))]);
      pathC.push([Number((baseLat + arcC).toFixed(4)), Number(lonI.toFixed(4))]);
    }

    const calcDist = (pts: [number, number][]) => {
      let d = 0;
      for (let k = 0; k < pts.length - 1; k++) {
        const p1 = pts[k];
        const p2 = pts[k + 1];
        const dlat = (p2[0] - p1[0]) * Math.PI / 180;
        const dlon = (p2[1] - p1[1]) * Math.PI / 180;
        const a = Math.sin(dlat / 2) ** 2 + Math.cos(p1[0] * Math.PI / 180) * Math.cos(p2[0] * Math.PI / 180) * Math.sin(dlon / 2) ** 2;
        d += 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(Math.max(0, 1 - a)));
      }
      return Math.round(d);
    };

    const distA = calcDist(pathA);
    const distB = calcDist(pathB);
    const distC = calcDist(pathC);

    const speed = vessel.speed || vessel.sog || 14.0;
    const hA = Math.max(1, Math.round(distA / (speed * 0.9 * 1.852)));
    const hB = Math.max(1, Math.round(distB / (speed * 0.96 * 1.852)));
    const hC = Math.max(1, Math.round(distC / (speed * 1.852)));

    return [
      {
        id: `${vessel.id}-route-b`,
        name: 'ROUTE B (OPTIMAL)',
        vessel_id: vessel.id,
        distance: distB,
        eta: `${hB}h 15m`,
        iceRisk: 'MODERATE',
        icebergRisk: 'LOW',
        weatherRisk: 'MODERATE',
        overallScore: 92,
        recommended: true,
        rioScore: '+8.4',
        sicExposure: 24,
        reason: `Multi-objective AI optimal corridor towards ${dest.name}. Balances open leads with iceberg separation.`,
        fuelConsumption: `${Math.round(distB * 0.024)} MT`,
        safetyMargin: 'OPTIMAL',
        path: pathB,
        waypoints: []
      },
      {
        id: `${vessel.id}-route-c`,
        name: 'ROUTE C (SAFEST)',
        vessel_id: vessel.id,
        distance: distC,
        eta: `${hC}h 30m`,
        iceRisk: 'LOW',
        icebergRisk: 'VERY LOW',
        weatherRisk: 'LOW',
        overallScore: 86,
        recommended: false,
        rioScore: '+14.8',
        sicExposure: 8,
        reason: `Maximum safety margin corridor skirting Marginal Ice Zone perimeter towards ${dest.name}.`,
        fuelConsumption: `${Math.round(distC * 0.028)} MT`,
        safetyMargin: 'VERIFIED',
        path: pathC,
        waypoints: []
      },
      {
        id: `${vessel.id}-route-a`,
        name: 'ROUTE A (FASTEST)',
        vessel_id: vessel.id,
        distance: distA,
        eta: `${hA}h 45m`,
        iceRisk: 'HIGH',
        icebergRisk: 'HIGH',
        weatherRisk: 'MODERATE',
        overallScore: 48,
        recommended: false,
        rioScore: '-2.8',
        sicExposure: 65,
        reason: `Direct geodesic path towards ${dest.name}. Shortest track but encounters heavy multi-year pack ice.`,
        fuelConsumption: `${Math.round(distA * 0.035)} MT`,
        safetyMargin: 'CAUTION',
        path: pathA,
        waypoints: []
      }
    ];
  }, []);

  // Recompute route actively on demand (clearing cache)
  const recomputeRoutes = useCallback(async () => {
    if (!selectedVessel || !selectedDestination) return;
    const cacheKey = `${selectedVessel.id}_${selectedDestination.id}_${emergencyRerouteActive ? 'em' : 'norm'}_${whatIfScenario.active ? 'whatif' : 'norm'}`;
    routeCacheRef.current.delete(cacheKey);
    clearApiCache('/routes');
    setIsComputingRoutes(true);

    try {
      const res = await api.routes({
        vesselId: selectedVessel.id,
        destId: selectedDestination.id,
        destLat: selectedDestination.latitude,
        destLon: selectedDestination.longitude,
        destName: selectedDestination.name,
        emergency: emergencyRerouteActive
      });
      if (res?.routes?.length) {
        const formatted: RouteOption[] = res.routes.map((r: any, idx: number) => ({
          id: r.id || (idx === 1 ? 'route-b' : idx === 2 ? 'route-c' : 'route-a'),
          name: r.name || (idx === 1 ? 'ROUTE B (OPTIMAL)' : idx === 2 ? 'ROUTE C (SAFEST)' : 'ROUTE A (FASTEST)'),
          vessel_id: selectedVessel.id,
          distance: typeof r.distance_km === 'number' ? r.distance_km : parseFloat(String(r.distance || '').replace(/[^0-9.]/g, '')) || 3800,
          eta: r.eta || '32h 05m',
          iceRisk: r.iceRisk || r.ice_risk || (r.id?.includes('route-a') ? 'HIGH' : r.id?.includes('route-b') ? 'MODERATE' : 'LOW'),
          icebergRisk: r.icebergRisk || 'LOW',
          weatherRisk: r.weatherRisk || 'MODERATE',
          overallScore: r.overallScore || (r.id?.includes('route-b') ? 92 : r.id?.includes('route-c') ? 84 : 48),
          recommended: r.recommended ?? (r.id?.includes('route-b') || idx === 1),
          rioScore: r.rioScore ?? r.rio_score ?? (r.id?.includes('route-a') ? -2.8 : r.id?.includes('route-b') ? 8.4 : 14.8),
          sicExposure: r.sicExposure ?? (r.id?.includes('route-a') ? 65 : r.id?.includes('route-b') ? 22 : 6),
          reason: r.reason || `Optimized polar navigation corridor for ${selectedVessel.name}.`,
          decision_explanation: r.decision_explanation || r.reason || `Optimized polar navigation corridor for ${selectedVessel.name}.`,
          fuelConsumption: r.fuelConsumption || r.fuel_estimate || '104 MT',
          safetyMargin: r.safetyMargin || 'OPTIMAL',
          costs: r.costs || r.cost_breakdown || {},
          cost_breakdown: r.cost_breakdown || r.costs || {},
          path: r.path || [],
          waypoints: r.waypoints || []
        }));
        routeCacheRef.current.set(cacheKey, formatted);
        setRoutes(formatted);
        setActiveRouteId(formatted[0].id);
      } else {
        const fallback = generateFallbackCorridors(selectedVessel, selectedDestination);
        routeCacheRef.current.set(cacheKey, fallback);
        setRoutes(fallback);
      }
    } catch (e) {
      console.error('Failed to recompute routes, using fallback:', e);
      const fallback = generateFallbackCorridors(selectedVessel, selectedDestination);
      routeCacheRef.current.set(cacheKey, fallback);
      setRoutes(fallback);
    } finally {
      setIsComputingRoutes(false);
    }
  }, [selectedVessel, selectedDestination, emergencyRerouteActive, whatIfScenario.active, generateFallbackCorridors]);

  // Fetch / update corridors reactively for the selected vessel AND destination with zero-delay client caching
  useEffect(() => {
    if (!selectedVessel || !selectedDestination) return;

    const cacheKey = `${selectedVessel.id}_${selectedDestination.id}_${emergencyRerouteActive ? 'em' : 'norm'}_${whatIfScenario.active ? 'whatif' : 'norm'}`;

    if (routeCacheRef.current.has(cacheKey)) {
      setRoutes(routeCacheRef.current.get(cacheKey)!);
      return;
    }
    
    let isCancelled = false;
    setIsComputingRoutes(true);
    api.routes({
      vesselId: selectedVessel.id,
      destId: selectedDestination.id,
      destLat: selectedDestination.latitude,
      destLon: selectedDestination.longitude,
      destName: selectedDestination.name,
      emergency: emergencyRerouteActive
    }).then((res) => {
      if (isCancelled) return;
      if (res?.routes?.length) {
        const formatted: RouteOption[] = res.routes.map((r: any, idx: number) => ({
          id: r.id || (idx === 1 ? 'route-b' : idx === 2 ? 'route-c' : 'route-a'),
          name: r.name || (idx === 1 ? 'ROUTE B (OPTIMAL)' : idx === 2 ? 'ROUTE C (SAFEST)' : 'ROUTE A (FASTEST)'),
          vessel_id: selectedVessel.id,
          distance: typeof r.distance_km === 'number' ? r.distance_km : parseFloat(String(r.distance || '').replace(/[^0-9.]/g, '')) || 3800,
          eta: r.eta || '32h 05m',
          iceRisk: r.iceRisk || r.ice_risk || (r.id?.includes('route-a') ? 'HIGH' : r.id?.includes('route-b') ? 'MODERATE' : 'LOW'),
          icebergRisk: r.icebergRisk || 'LOW',
          weatherRisk: r.weatherRisk || 'MODERATE',
          overallScore: r.overallScore || (r.id?.includes('route-b') ? 92 : r.id?.includes('route-c') ? 84 : 48),
          recommended: r.recommended ?? (r.id?.includes('route-b') || idx === 1),
          rioScore: r.rioScore ?? r.rio_score ?? (r.id?.includes('route-a') ? -2.8 : r.id?.includes('route-b') ? 8.4 : 14.8),
          sicExposure: r.sicExposure ?? (r.id?.includes('route-a') ? 65 : r.id?.includes('route-b') ? 22 : 6),
          reason: r.reason || `Optimized polar navigation corridor for ${selectedVessel.name}.`,
          decision_explanation: r.decision_explanation || r.reason || `Optimized polar navigation corridor for ${selectedVessel.name}.`,
          fuelConsumption: r.fuelConsumption || r.fuel_estimate || '104 MT',
          safetyMargin: r.safetyMargin || 'OPTIMAL',
          costs: r.costs || r.cost_breakdown || {},
          cost_breakdown: r.cost_breakdown || r.costs || {},
          path: r.path || [],
          waypoints: r.waypoints || []
        }));
        routeCacheRef.current.set(cacheKey, formatted);
        setRoutes(formatted);
      } else {
        const fallback = generateFallbackCorridors(selectedVessel, selectedDestination);
        routeCacheRef.current.set(cacheKey, fallback);
        setRoutes(fallback);
      }
    }).catch(() => {
      if (isCancelled) return;
      const fallback = generateFallbackCorridors(selectedVessel, selectedDestination);
      routeCacheRef.current.set(cacheKey, fallback);
      setRoutes(fallback);
    }).finally(() => {
      if (!isCancelled) {
        setIsComputingRoutes(false);
      }
    });

    return () => {
      isCancelled = true;
    };
  }, [selectedVessel?.id, selectedDestination?.id, selectedDestination?.latitude, selectedDestination?.longitude, emergencyRerouteActive, whatIfScenario.active, generateFallbackCorridors]);

  // Derive active route
  const activeRoute = useMemo(() => {
    return routes.find(r => r.id === activeRouteId || r.id?.includes(activeRouteId)) || routes[0] || null;
  }, [routes, activeRouteId]);

  const value = useMemo(() => ({
    fleet,
    selectedVesselId,
    selectedVessel,
    setSelectedVesselId,
    stations,
    selectedDestinationId,
    selectedDestination,
    setSelectedDestinationId,
    missionId,
    missionType,
    setMissionType,
    optimizationPriority,
    setOptimizationPriority,
    selectedIcebergId,
    setSelectedIcebergId,
    routes,
    activeRouteId,
    setActiveRouteId,
    activeRoute,
    emergencyRerouteActive,
    setEmergencyRerouteActive,
    tacticalAlert,
    setTacticalAlert,
    triggerEmergencyHazard,
    dismissTacticalAlert,
    whatIfScenario,
    setWhatIfScenario,
    isLoading,
    isComputingRoutes,
    refreshFleet,
    recomputeRoutes,
    setCustomDestination
  }), [
    fleet,
    selectedVesselId,
    selectedVessel,
    setSelectedVesselId,
    stations,
    selectedDestinationId,
    selectedDestination,
    setSelectedDestinationId,
    missionId,
    missionType,
    setMissionType,
    optimizationPriority,
    setOptimizationPriority,
    selectedIcebergId,
    routes,
    activeRouteId,
    activeRoute,
    emergencyRerouteActive,
    tacticalAlert,
    triggerEmergencyHazard,
    dismissTacticalAlert,
    whatIfScenario,
    isLoading,
    isComputingRoutes,
    refreshFleet,
    recomputeRoutes,
    setCustomDestination
  ]);

  return (
    <FleetContext.Provider value={value}>
      {children}
    </FleetContext.Provider>
  );
};

export function useFleet() {
  const context = useContext(FleetContext);
  if (!context) {
    throw new Error('useFleet must be used within a FleetProvider');
  }
  return context;
}
