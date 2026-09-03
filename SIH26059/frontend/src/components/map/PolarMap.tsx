import React, { useEffect, useRef, useState, useMemo } from 'react';
import {
  Map as MapLibreMap,
  Marker as MapLibreMarker,
  type StyleSpecification,
  type GeoJSONSource
} from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { FeatureCollection, Feature } from 'geojson';
import {
  Layers,
  Compass,
  Crosshair,
  Globe,
  ChevronDown,
  ChevronUp,
  Ship,
  ShieldAlert,
  Waves,
  X
} from 'lucide-react';
import { api } from '../../services/api';
import { useFleet, CANONICAL_FLEET } from '../../context/FleetContext';

// MapTiler API Key (optional)
const MAPTILER_API_KEY = import.meta.env.VITE_MAPTILER_API_KEY || '';

// High-contrast Polar Dark Matter Nautical Base Style (CartoDB Dark)
const DARK_MATTER_STYLE: StyleSpecification = {
  version: 8,
  sources: {
    'carto-dark': {
      type: 'raster',
      tiles: [
        'https://a.basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}.png',
        'https://b.basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}.png',
        'https://c.basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}.png',
        'https://d.basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}.png'
      ],
      tileSize: 256,
      attribution: '© CARTO © OpenStreetMap'
    }
  },
  layers: [
    {
      id: 'background',
      type: 'background',
      paint: {
        'background-color': '#060d17'
      }
    },
    {
      id: 'carto-base',
      type: 'raster',
      source: 'carto-dark',
      minzoom: 0,
      maxzoom: 19
    }
  ]
};

// Standard Operational Sectors
const OPERATIONAL_SECTOR = {
  center: [-58.5, -63.5] as [number, number], // Antarctic Peninsula / Bransfield Strait / South Shetland Islands
  zoom: 4.8,
  label: 'Operational Sector (Antarctic Peninsula)'
};

const CIRCUMPOLAR_SECTOR = {
  center: [0.0, -70.0] as [number, number],
  zoom: 2.5,
  label: 'Circumpolar Antarctic Basin'
};


// Gaussian smoothing helper for seamless circumpolar waves
function smoothArrayCircular(arr: number[], radius: number = 3): number[] {
  if (!arr || arr.length === 0) return [];
  const n = arr.length;
  const result: number[] = new Array(n);
  for (let i = 0; i < n; i++) {
    let sum = 0;
    let weightSum = 0;
    for (let r = -radius; r <= radius; r++) {
      const idx = (i + r + n) % n;
      const weight = Math.exp(-0.5 * Math.pow(r / (radius * 0.6), 2));
      sum += arr[idx] * weight;
      weightSum += weight;
    }
    result[i] = weightSum > 0 ? sum / weightSum : arr[i];
  }
  return result;
}

// Generate smooth, seamless real-data contoured sea ice wave ribbons (Subtle environmental fills)
function generateSmoothRealDataIceBands(sicPoints: [number, number, number][] | null, timeStepStr: string = '0'): FeatureCollection {
  const timeStepIdx = parseInt(timeStepStr, 10) || 0;
  const driftOffset = timeStepIdx * 0.45;

  const features: Feature[] = [];
  const lonStep = 2.0;
  const lons: number[] = [];
  for (let l = -180; l <= 180; l += lonStep) {
    lons.push(l);
  }
  const n = lons.length;

  // Pre-bin points by integer longitude for instant O(1) proximity lookups (180x speedup)
  const lonBins = new Map<number, [number, number, number][]>();
  if (sicPoints && sicPoints.length > 0) {
    for (let j = 0; j < sicPoints.length; j++) {
      const pt = sicPoints[j];
      const binKey = Math.round(pt[1]);
      let bin = lonBins.get(binKey);
      if (!bin) {
        bin = [];
        lonBins.set(binKey, bin);
      }
      bin.push(pt);
    }
  }

  const rawCoast: number[] = [];
  const rawFast: number[] = [];
  const rawPack: number[] = [];
  const rawMiz: number[] = [];

  for (let i = 0; i < n; i++) {
    const lon = lons[i];
    const bPts: [number, number, number][] = [];
    if (sicPoints && sicPoints.length > 0) {
      for (let offset = -6; offset <= 6; offset++) {
        let lookupKey = Math.round(lon + offset);
        if (lookupKey > 180) lookupKey -= 360;
        if (lookupKey < -180) lookupKey += 360;
        const bin = lonBins.get(lookupKey);
        if (bin) {
          for (let k = 0; k < bin.length; k++) {
            bPts.push(bin[k]);
          }
        }
      }
    }

    const rad = (lon * Math.PI) / 180;
    const rPeninsula = 5.8 * Math.exp(-Math.pow((lon - (-64)) / 22, 2));
    const rWeddell = -7.2 * Math.exp(-Math.pow((lon - (-45)) / 28, 2));
    const rRoss = -8.8 * Math.exp(-Math.pow((lon - 175) / 28, 2));
    const rAmery = -3.5 * Math.exp(-Math.pow((lon - 74) / 18, 2));
    const rWaves = 1.2 * Math.sin(rad * 3) + 0.8 * Math.cos(rad * 5);
    const coastLat = -69.2 + rPeninsula + rWeddell + rRoss + rAmery + rWaves;

    let maxFast = -999;
    let maxPack = -999;
    let maxMiz = -999;

    for (let k = 0; k < bPts.length; k++) {
      const p = bPts[k];
      const conc = p[2] <= 1.0 ? p[2] * 100 : p[2];
      const latVal = p[0];
      if (conc >= 68 && latVal > maxFast) maxFast = latVal;
      if (conc >= 45 && latVal > maxPack) maxPack = latVal;
      if (conc >= 12 && latVal > maxMiz) maxMiz = latVal;
    }

    const fLat = maxFast !== -999 ? maxFast : coastLat + 2.8;
    const pLat = maxPack !== -999 ? maxPack : fLat + 3.8;
    const mLat = maxMiz !== -999 ? maxMiz : pLat + 4.2;

    rawCoast.push(coastLat);
    rawFast.push(Math.min(-60.0, fLat + driftOffset * 0.2));
    rawPack.push(Math.min(-56.0, pLat + driftOffset * 0.5));
    rawMiz.push(Math.min(-52.0, mLat + driftOffset * 0.85));
  }

  const smoothCoast = smoothArrayCircular(rawCoast, 4);
  const smoothFast = smoothArrayCircular(rawFast, 4);
  const smoothPack = smoothArrayCircular(rawPack, 4);
  const smoothMiz = smoothArrayCircular(rawMiz, 4);

  // 1. BOUNDARY CONTOUR WAVE LINES (Subtle environmental edges)
  const fastLine: [number, number][] = lons.map((lon, i) => [lon, smoothFast[i]]);
  const packLine: [number, number][] = lons.map((lon, i) => [lon, smoothPack[i]]);
  const mizLine: [number, number][] = lons.map((lon, i) => [lon, smoothMiz[i]]);

  features.push({
    type: 'Feature',
    properties: { id: 'miz-wave-line', label: '15–50% Marginal Ice Zone Edge', strokeColor: '#0284C7', strokeWidth: 1.2 },
    geometry: { type: 'LineString', coordinates: mizLine }
  });

  features.push({
    type: 'Feature',
    properties: { id: 'pack-wave-line', label: '50–80% Pack Ice Boundary', strokeColor: '#00F2FE', strokeWidth: 1.8 },
    geometry: { type: 'LineString', coordinates: packLine }
  });

  features.push({
    type: 'Feature',
    properties: { id: 'fast-wave-line', label: '80–100% Fast Ice Boundary', strokeColor: '#FFFFFF', strokeWidth: 2.0 },
    geometry: { type: 'LineString', coordinates: fastLine }
  });

  // 2. SUBTLE TRANSLUCENT CONTINUOUS RIBBONS (Environmental background, 0.10 - 0.28 opacity)
  const fastRing: [number, number][] = [];
  for (let i = 0; i < n; i++) fastRing.push([lons[i], smoothFast[i]]);
  for (let i = n - 1; i >= 0; i--) fastRing.push([lons[i], smoothCoast[i]]);
  fastRing.push([lons[0], smoothFast[0]]);

  features.push({
    type: 'Feature',
    properties: {
      id: 'fast-ice-band',
      label: '80–100% (Fast Ice)',
      fillColor: 'rgba(188, 238, 250, 0.28)'
    },
    geometry: {
      type: 'Polygon',
      coordinates: [fastRing]
    }
  });

  const packRing: [number, number][] = [];
  for (let i = 0; i < n; i++) packRing.push([lons[i], smoothPack[i]]);
  for (let i = n - 1; i >= 0; i--) packRing.push([lons[i], smoothFast[i]]);
  packRing.push([lons[0], smoothPack[0]]);

  features.push({
    type: 'Feature',
    properties: {
      id: 'pack-ice-band',
      label: '50–80% (Pack Ice)',
      fillColor: 'rgba(0, 216, 246, 0.18)'
    },
    geometry: {
      type: 'Polygon',
      coordinates: [packRing]
    }
  });

  const mizRing: [number, number][] = [];
  for (let i = 0; i < n; i++) mizRing.push([lons[i], smoothMiz[i]]);
  for (let i = n - 1; i >= 0; i--) mizRing.push([lons[i], smoothPack[i]]);
  mizRing.push([lons[0], smoothMiz[0]]);

  features.push({
    type: 'Feature',
    properties: {
      id: 'miz-ice-band',
      label: '15–50% (Marginal Ice Zone)',
      fillColor: 'rgba(2, 132, 199, 0.10)'
    },
    geometry: {
      type: 'Polygon',
      coordinates: [mizRing]
    }
  });

  return { type: 'FeatureCollection', features };
}

type MapSection = 'overview' | 'navigation' | 'sea-ice' | 'icebergs' | 'routes' | 'intelligence';

interface SectionLayerConfig {
  showSeaIce: boolean;
  showIcebergs: boolean;
  showVessel: boolean;
  showHistoricalVessels: boolean;
  showRoute: boolean;
}

const SECTION_CONFIGS: Record<MapSection, SectionLayerConfig> = {
  'overview':      { showSeaIce: true,  showIcebergs: true,  showVessel: true,  showHistoricalVessels: true,  showRoute: true },
  'navigation':    { showSeaIce: true,  showIcebergs: true,  showVessel: true,  showHistoricalVessels: true,  showRoute: true },
  'sea-ice':       { showSeaIce: true,  showIcebergs: false, showVessel: true,  showHistoricalVessels: false, showRoute: false },
  'icebergs':      { showSeaIce: false, showIcebergs: true,  showVessel: true,  showHistoricalVessels: false, showRoute: false },
  'routes':        { showSeaIce: true,  showIcebergs: true,  showVessel: true,  showHistoricalVessels: true,  showRoute: true },
  'intelligence':  { showSeaIce: false, showIcebergs: false, showVessel: false, showHistoricalVessels: false, showRoute: false },
};

interface WaypointItem {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  distanceFromStart?: number;
  eta?: string;
  status?: 'passed' | 'active' | 'upcoming';
  iceRisk?: string;
}

interface VesselItem {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  speed: number;
  heading: number;
  destination?: string;
  dest_lat?: number;
  dest_lon?: number;
  eta?: string;
  flag?: string;
  source?: string;
  total_points?: number;
  track?: [number, number][];
}

export interface PolarMapProps {
  selectedIcebergId?: string | null;
  onSelectIceberg?: (id: string | null) => void;
  showRouteOptimization?: boolean;
  showVessel?: boolean;
  showRoute?: boolean;
  showSeaIce?: boolean;
  showIcebergs?: boolean;
  activeRouteId?: string;
  onSelectRoute?: (routeId: string) => void;
  activeHorizon?: 'NOW' | '+6H' | '+12H' | '+24H' | '+48H';
  destinationMarker?: { latitude: number; longitude: number; name: string } | null;
  showHistoricalVessels?: boolean;
  selectedVesselId?: string | null;
  onSelectVessel?: (id: string) => void;
  allVessels?: VesselItem[];
  section?: MapSection;
  timeStep?: string;
  customRoutePath?: [number, number][];
  allRoutes?: any[];
  waypoints?: WaypointItem[];
  icebergs?: any[];
  vesselInfo?: {
    name: string;
    latitude: number;
    longitude: number;
    speed: number;
    heading: number;
  } | null;
  focusTarget?: [number, number] | null;
}

export const PolarMap: React.FC<PolarMapProps> = ({
  selectedIcebergId = null,
  onSelectIceberg = () => {},
  showVessel,
  showRoute,
  showSeaIce,
  showIcebergs,
  activeRouteId = 'route-b',
  onSelectRoute = () => {},
  activeHorizon = 'NOW',
  destinationMarker = null,
  selectedVesselId = null,
  onSelectVessel = () => {},
  allVessels: externalVessels,
  section = 'overview',
  timeStep = '0',
  customRoutePath: _customRoutePath,
  waypoints = [],
  icebergs: externalIcebergs,
  vesselInfo = null,
  focusTarget = null,
  allRoutes = [],
}) => {
  const sectionConfig = SECTION_CONFIGS[section] || SECTION_CONFIGS['overview'];
  const effectiveShowSeaIce = showSeaIce !== undefined ? showSeaIce : sectionConfig.showSeaIce;
  const effectiveShowIcebergs = showIcebergs !== undefined ? showIcebergs : sectionConfig.showIcebergs;
  const effectiveShowVessel = showVessel !== undefined ? showVessel : sectionConfig.showVessel;
  const effectiveShowRoute = showRoute !== undefined ? showRoute : sectionConfig.showRoute;
  const { 
    fleet: contextFleet, 
    selectedVesselId: contextSelectedVesselId, 
    setSelectedVesselId: contextSetSelectedVesselId,
    selectedIcebergId: contextSelectedIcebergId,
    setSelectedIcebergId: contextSetSelectedIcebergId
  } = useFleet();

  const activeSelectedIcebergId = selectedIcebergId !== undefined && selectedIcebergId !== null 
    ? selectedIcebergId 
    : contextSelectedIcebergId;

  const handleIcebergSelect = (ibId: string) => {
    contextSetSelectedIcebergId(ibId);
    onSelectIceberg(ibId);
  };

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<MapLibreMap | null>(null);
  const markersRef = useRef<MapLibreMarker[]>([]);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [sicGridData, setSicGridData] = useState<any>(null);
  const [apiIcebergs, setApiIcebergs] = useState<any[]>([]);
  const [vesselRoutes, setVesselRoutes] = useState<any[]>([]);
  const [oceanCurrentsData, setOceanCurrentsData] = useState<any>(null);
  const [stations, setStations] = useState<any[]>([]);
  const [landMaskData, setLandMaskData] = useState<any>(null);

  // Viewport mode: 'OPERATIONAL' (Peninsula focus) or 'CIRCUMPOLAR' (Global view)
  const [viewportMode, setViewportMode] = useState<'OPERATIONAL' | 'CIRCUMPOLAR'>('OPERATIONAL');
  const [mapZoom, setMapZoom] = useState<number>(OPERATIONAL_SECTOR.zoom);
  const mapZoomRef = useRef<number>(OPERATIONAL_SECTOR.zoom);

  // Floating HUD UI state
  const [layersMenuOpen, setLayersMenuOpen] = useState(false);
  const [legendCollapsed, setLegendCollapsed] = useState(true);

  // Layer Toggles (User controlled with defaults from sectionConfig)
  const [layerToggles, setLayerToggles] = useState({
    activeVessel: effectiveShowVessel,
    otherVessels: true,
    recommendedRoute: effectiveShowRoute,
    altRoutes: true,
    icebergs: effectiveShowIcebergs,
    icebergTrajectories: true,
    seaIce: effectiveShowSeaIce,
    oceanCurrents: false,
    stations: true
  });

  // Keep toggles in sync with section changes
  useEffect(() => {
    setLayerToggles(prev => ({
      ...prev,
      activeVessel: effectiveShowVessel,
      recommendedRoute: effectiveShowRoute,
      icebergs: effectiveShowIcebergs,
      seaIce: effectiveShowSeaIce
    }));
  }, [effectiveShowVessel, effectiveShowRoute, effectiveShowIcebergs, effectiveShowSeaIce]);

  // Active Vessel Selection: prioritize explicit prop or global FleetContext
  const currentVesselId = selectedVesselId || contextSelectedVesselId || 'rv_sagar_nidhi';

  // Unified Hover Probe Card (for Icebergs, Sea Ice, Routes, Vessels)
  const [probeData, setProbeData] = useState<{
    type: 'ICEBERG' | 'SEA_ICE' | 'ROUTE' | 'VESSEL' | 'CURRENT';
    title: string;
    badge: string;
    badgeColor: string;
    details: { label: string; value: string | number }[];
    x: number;
    y: number;
  } | null>(null);

  // Fetch COMNAP Antarctic facilities & Land Mask
  useEffect(() => {
    api.stations().then((res) => {
      if (res?.stations?.length) setStations(res.stations);
    }).catch(() => {});

    api.landMask().then((res) => {
      if (res && (res.type === 'FeatureCollection' || res.type === 'Feature')) {
        setLandMaskData(res);
      }
    }).catch(() => {});

    // Fetch Copernicus surface current grid
    api.oceanCurrentsGrid().then((res) => {
      if (res?.features?.length) {
        setOceanCurrentsData(res);
      }
    }).catch(() => {});
  }, []);

  const fleetVessels: any[] = externalVessels && externalVessels.length > 0
    ? externalVessels
    : contextFleet && contextFleet.length > 0
    ? contextFleet
    : CANONICAL_FLEET;

  const activeVessel = fleetVessels.find(v => v.id === currentVesselId) || fleetVessels[0] || (vesselInfo ? { ...vesselInfo, id: 'custom' } : null);

  // Fetch routes for current active vessel & destination
  useEffect(() => {
    if (allRoutes && allRoutes.length > 0) {
      const isForActive = allRoutes.every((r: any) => !r.vessel_id || r.vessel_id === activeVessel?.id);
      if (isForActive) {
        setVesselRoutes(allRoutes);
        return;
      }
    }
    if (!activeVessel?.id) return;
    const dLat = destinationMarker?.latitude ?? (destinationMarker as any)?.lat ?? activeVessel.dest_lat;
    const dLon = destinationMarker?.longitude ?? (destinationMarker as any)?.lon ?? activeVessel.dest_lon;
    const dName = destinationMarker?.name ?? activeVessel.destination;
    api.routes({
      vesselId: activeVessel.id,
      destLat: dLat,
      destLon: dLon,
      destName: dName
    }).then((res) => {
      if (res?.routes?.length) {
        setVesselRoutes(res.routes);
      } else {
        setVesselRoutes([]);
      }
    }).catch(() => setVesselRoutes([]));
  }, [activeVessel?.id, destinationMarker?.latitude, destinationMarker?.longitude, (destinationMarker as any)?.lat, (destinationMarker as any)?.lon, allRoutes]);

  // Fetch ALL real icebergs from backend API (all 85 targets)
  useEffect(() => {
    api.icebergs().then((res) => {
      if (res?.icebergs?.length) setApiIcebergs(res.icebergs);
    });
  }, []);

  // Memoize activeIcebergs so it has a stable reference for useEffect deps
  const activeIcebergs = useMemo(() =>
    externalIcebergs && externalIcebergs.length > 0
      ? externalIcebergs
      : apiIcebergs.length > 0
      ? apiIcebergs
      : [],
  [externalIcebergs, apiIcebergs]);

  // Fetch real circumpolar SIC grid from backend API (2,979 observation points)
  useEffect(() => {
    if (!layerToggles.seaIce) return;
    api.sicGrid(timeStep).then((res) => {
      if (res?.points?.length) {
        setSicGridData(res);
      }
    }).catch(() => {});
  }, [layerToggles.seaIce, timeStep]);

  // Generate 100% Full Smooth Real-Data Circumpolar Ice Bands (Zero seam cuts)
  const smoothIceBandsGeoJSON = useMemo<FeatureCollection>(() => {
    return generateSmoothRealDataIceBands(sicGridData?.points || null, timeStep);
  }, [sicGridData, timeStep]);

  // Active Route Object
  const activeRouteKey = activeRouteId.includes('route-c') ? 'route-c' : activeRouteId.includes('route-a') ? 'route-a' : 'route-b';
  const activeRouteObj = vesselRoutes.find(r => 
    r.id === activeRouteId || 
    r.id === `${currentVesselId}-${activeRouteId}` ||
    r.id.endsWith(activeRouteKey)
  ) || vesselRoutes[0];

  // Handle vessel selection (triggers global context and optional callback)
  const handleVesselChange = (vesselId: string) => {
    contextSetSelectedVesselId(vesselId);
    onSelectVessel(vesselId);
    const target = fleetVessels.find(v => v.id === vesselId);
    if (target && mapInstanceRef.current) {
      const dLat = target.dest_lat;
      const dLon = target.dest_lon;
      const vLat = target.latitude;
      const vLon = target.longitude;

      if (typeof dLat === 'number' && typeof dLon === 'number' && !isNaN(dLat) && !isNaN(dLon)) {
        const minLon = Math.min(vLon, dLon) - 3.5;
        const maxLon = Math.max(vLon, dLon) + 3.5;
        const minLat = Math.min(vLat, dLat) - 2;
        const maxLat = Math.max(vLat, dLat) + 2;

        mapInstanceRef.current.fitBounds([[minLon, minLat], [maxLon, maxLat]], {
          padding: { top: 80, bottom: 100, left: 80, right: 80 },
          maxZoom: 5.8,
          duration: 1200
        });
      } else {
        mapInstanceRef.current.flyTo({
          center: [target.longitude, target.latitude],
          zoom: 5.0,
          duration: 1200,
          essential: true
        });
      }
    }
  };

  // Automatically frame the active voyage (vessel to destination) when destination or vessel changes
  useEffect(() => {
    if (!mapInstanceRef.current || !activeVessel) return;
    const dLat = destinationMarker?.latitude ?? (destinationMarker as any)?.lat ?? activeVessel.dest_lat;
    const dLon = destinationMarker?.longitude ?? (destinationMarker as any)?.lon ?? activeVessel.dest_lon;
    const vLat = activeVessel.latitude;
    const vLon = activeVessel.longitude;
    if (typeof dLat === 'number' && typeof dLon === 'number' && !isNaN(dLat) && !isNaN(dLon)) {
      const minLon = Math.min(vLon, dLon) - 3.5;
      const maxLon = Math.max(vLon, dLon) + 3.5;
      const minLat = Math.min(vLat, dLat) - 2;
      const maxLat = Math.max(vLat, dLat) + 2;

      mapInstanceRef.current.fitBounds([[minLon, minLat], [maxLon, maxLat]], {
        padding: { top: 80, bottom: 100, left: 80, right: 80 },
        maxZoom: 5.8,
        duration: 1200
      });
    }
  }, [activeVessel?.id, destinationMarker?.latitude, destinationMarker?.longitude]);

  // Viewport switch handler
  const handleViewportSwitch = (mode: 'OPERATIONAL' | 'CIRCUMPOLAR') => {
    setViewportMode(mode);
    if (!mapInstanceRef.current) return;
    if (mode === 'OPERATIONAL') {
      const vLon = activeVessel?.longitude ?? OPERATIONAL_SECTOR.center[0];
      const vLat = activeVessel?.latitude ?? OPERATIONAL_SECTOR.center[1];
      setMapZoom(OPERATIONAL_SECTOR.zoom);
      mapInstanceRef.current.flyTo({
        center: [vLon, vLat],
        zoom: OPERATIONAL_SECTOR.zoom,
        duration: 1200,
        essential: true
      });
    } else {
      setMapZoom(CIRCUMPOLAR_SECTOR.zoom);
      mapInstanceRef.current.flyTo({
        center: CIRCUMPOLAR_SECTOR.center,
        zoom: CIRCUMPOLAR_SECTOR.zoom,
        duration: 1400,
        essential: true
      });
    }
  };

  // 1. Initialize MapLibre GL Map (OPERATIONAL FOCUSED INITIAL VIEW — always starts on Antarctic Peninsula)
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const mapStyle: string | StyleSpecification = MAPTILER_API_KEY
      ? `https://api.maptiler.com/maps/darkmatter/style.json?key=${MAPTILER_API_KEY}`
      : DARK_MATTER_STYLE;

    // Always start centered on Antarctic operational sector (Bransfield Strait / Peninsula)
    // Do NOT use vessel position here — vessel may be in Indian Ocean (Sagar Nidhi) or Pacific
    const initialCenter: [number, number] = OPERATIONAL_SECTOR.center; // [lon, lat]

    const map = new MapLibreMap({
      container: mapContainerRef.current,
      style: mapStyle,
      center: initialCenter,
      zoom: OPERATIONAL_SECTOR.zoom,
      minZoom: 1.5,
      maxZoom: 12,
      attributionControl: false,
      renderWorldCopies: false,
      dragRotate: false,
      pitchWithRotate: false,
      touchPitch: false,
      fadeDuration: 0,
      trackResize: true
    });

    map.on('dragstart', () => {
      setProbeData(null);
    });

    map.on('load', () => {
      setMapLoaded(true);
      setMapZoom(map.getZoom());
    });

    map.on('zoomend', () => {
      const z = map.getZoom();
      setMapZoom(z);
      mapZoomRef.current = z;
    });

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // 2. Auto-Fit Bounds when Destination or Route changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !mapLoaded) return;

    if (focusTarget && Array.isArray(focusTarget) && typeof focusTarget[0] === 'number' && !isNaN(focusTarget[0]) && typeof focusTarget[1] === 'number' && !isNaN(focusTarget[1])) {
      map.flyTo({ center: [focusTarget[1], focusTarget[0]], zoom: 5.2, duration: 1200, essential: true });
      return;
    }

    if (activeSelectedIcebergId) return; // Preserve camera focus when inspecting icebergs

    const dLat = destinationMarker?.latitude ?? (destinationMarker as any)?.lat ?? activeVessel?.dest_lat;
    const dLon = destinationMarker?.longitude ?? (destinationMarker as any)?.lon ?? activeVessel?.dest_lon;
    const vLat = activeVessel?.latitude ?? (activeVessel as any)?.lat;
    const vLon = activeVessel?.longitude ?? (activeVessel as any)?.lon;

    if (viewportMode === 'OPERATIONAL' && typeof vLat === 'number' && !isNaN(vLat) && typeof vLon === 'number' && !isNaN(vLon)) {
      if (typeof dLat === 'number' && typeof dLon === 'number' && !isNaN(dLat) && !isNaN(dLon)) {
        const minLon = Math.min(vLon, dLon) - 3.5;
        const maxLon = Math.max(vLon, dLon) + 3.5;
        const minLat = Math.min(vLat, dLat) - 2;
        const maxLat = Math.max(vLat, dLat) + 2;

        if (isFinite(minLon) && isFinite(maxLon) && isFinite(minLat) && isFinite(maxLat)) {
          map.fitBounds([[minLon, minLat], [maxLon, maxLat]], {
            padding: { top: 70, bottom: 90, left: 70, right: 70 },
            maxZoom: 5.8,
            duration: 1200
          });
        }
      } else {
        map.flyTo({
          center: [vLon, vLat],
          zoom: 5.0,
          duration: 1200,
          essential: true
        });
      }
    }
  }, [
    destinationMarker, 
    focusTarget, 
    activeVessel?.id, 
    activeVessel?.latitude, 
    activeVessel?.longitude, 
    activeVessel?.dest_lat,
    activeVessel?.dest_lon,
    (activeVessel as any)?.lat, 
    (activeVessel as any)?.lon, 
    mapLoaded, 
    viewportMode, 
    activeSelectedIcebergId
  ]);

  // Center on selected iceberg with tactical zoom
  useEffect(() => {
    if (!mapInstanceRef.current || !activeSelectedIcebergId || !mapLoaded) return;

    // Search both active (prop-provided) AND locally fetched icebergs for robustness
    const ib = activeIcebergs.find((i: any) => i.id === activeSelectedIcebergId)
            ?? apiIcebergs.find((i: any) => i.id === activeSelectedIcebergId);

    if (!ib) return;

    const targetLon = ib.origin_longitude ?? ib.longitude;
    const targetLat = ib.origin_latitude ?? ib.latitude;

    if (typeof targetLon !== 'number' || typeof targetLat !== 'number' ||
        isNaN(targetLon) || isNaN(targetLat)) return;

    // Validate coordinates are in Southern Ocean range
    if (targetLat > 0 || targetLat < -90 || targetLon < -180 || targetLon > 180) return;

    // Use zoom 5.0 so iceberg AND its surroundings (sea ice, routes) are visible
    // Lower zoom than 6.5 avoids the "empty ocean" effect when iceberg is isolated
    const targetZoom = section === 'icebergs' ? 5.5 : 6.0;

    mapInstanceRef.current.flyTo({
      center: [targetLon, targetLat],
      zoom: targetZoom,
      essential: true,
      duration: 1000
    });
  }, [activeSelectedIcebergId, mapLoaded, activeIcebergs, apiIcebergs, section]);


  // 3. WebGL Environmental & Vector Layers
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !mapLoaded) return;

    // =========================================================================
    // 0. CONTINENTAL ANTARCTICA LAND MASK (Deep Navy Context)
    // =========================================================================
    if (landMaskData && !map.getSource('antarctica-land-src')) {
      map.addSource('antarctica-land-src', { type: 'geojson', data: landMaskData });
      map.addLayer({
        id: 'antarctica-land-fill',
        type: 'fill',
        source: 'antarctica-land-src',
        paint: {
          'fill-color': '#040B16',
          'fill-opacity': 0.98
        }
      });
      map.addLayer({
        id: 'antarctica-land-stroke',
        type: 'line',
        source: 'antarctica-land-src',
        paint: {
          'line-color': '#1E293B',
          'line-width': 1.4,
          'line-opacity': 0.85
        }
      });
    } else if (landMaskData && map.getSource('antarctica-land-src')) {
      (map.getSource('antarctica-land-src') as GeoJSONSource).setData(landMaskData);
    }

    // =========================================================================
    // A. SEA ICE CONCENTRATION (Environmental Background Layer - 0.28 Opacity)
    // =========================================================================
    if (!map.getSource('smooth-sea-ice-src')) {
      map.addSource('smooth-sea-ice-src', { type: 'geojson', data: smoothIceBandsGeoJSON });

      map.addLayer({
        id: 'smooth-ice-fills',
        type: 'fill',
        source: 'smooth-sea-ice-src',
        filter: ['==', '$type', 'Polygon'],
        paint: {
          'fill-color': ['get', 'fillColor'],
          'fill-opacity': 0.35
        },
        layout: { visibility: layerToggles.seaIce ? 'visible' : 'none' }
      });

      map.addLayer({
        id: 'smooth-ice-wave-stroke',
        type: 'line',
        source: 'smooth-sea-ice-src',
        filter: ['==', '$type', 'LineString'],
        paint: {
          'line-color': ['get', 'strokeColor'],
          'line-width': ['get', 'strokeWidth'],
          'line-opacity': 0.70
        },
        layout: { visibility: layerToggles.seaIce ? 'visible' : 'none' }
      });



    } else {
      const src = map.getSource('smooth-sea-ice-src') as GeoJSONSource;
      src.setData(smoothIceBandsGeoJSON);
      const vis = layerToggles.seaIce ? 'visible' : 'none';
      if (map.getLayer('smooth-ice-fills')) map.setLayoutProperty('smooth-ice-fills', 'visibility', vis);
      if (map.getLayer('smooth-ice-wave-stroke')) map.setLayoutProperty('smooth-ice-wave-stroke', 'visibility', vis);
    }

    // =========================================================================
    // B. OCEAN CURRENTS (Copernicus Marine Surface Velocity Vectors)
    // =========================================================================
    if (oceanCurrentsData) {
      if (!map.getSource('ocean-currents-src')) {
        map.addSource('ocean-currents-src', { type: 'geojson', data: oceanCurrentsData });
        map.addLayer({
          id: 'ocean-currents-points',
          type: 'circle',
          source: 'ocean-currents-src',
          paint: {
            'circle-radius': 2.5,
            'circle-color': '#0284C7',
            'circle-opacity': 0.65
          },
          layout: { visibility: layerToggles.oceanCurrents ? 'visible' : 'none' }
        });
      } else {
        (map.getSource('ocean-currents-src') as GeoJSONSource).setData(oceanCurrentsData);
        if (map.getLayer('ocean-currents-points')) {
          map.setLayoutProperty('ocean-currents-points', 'visibility', layerToggles.oceanCurrents ? 'visible' : 'none');
        }
      }
    }

    // =========================================================================
    // C. MULTI-CORRIDOR POLAR ROUTING (Strict ECDIS Hierarchy)
    // =========================================================================
    const routeFeaturesList: Feature[] = [];

    if (vesselRoutes && vesselRoutes.length > 0) {
      vesselRoutes.forEach((r) => {
        if (!r.path || r.path.length < 2) return;
        const isSelected = r.id === activeRouteObj?.id || (r.id.endsWith(activeRouteKey));
        const isRecommended = r.recommended || r.id.includes('route-b');
        
        // Active recommended route is prominent solid #10B981 emerald or #00F2FE cyan.
        // Alternative routes are thinner, dashed, muted #64748B.
        const color = isSelected
          ? (isRecommended ? '#10B981' : (r.id.includes('route-c') ? '#00F2FE' : '#F43F5E'))
          : '#64748B';

        const coords = r.path.map((pt: [number, number]) => [pt[1], pt[0]]);

        routeFeaturesList.push({
          type: 'Feature',
          properties: {
            id: r.id,
            name: r.name,
            color,
            width: isSelected ? 5.0 : 2.2,
            opacity: isSelected ? 0.98 : (layerToggles.altRoutes ? 0.40 : 0.0),
            glowWidth: isSelected ? 10 : 0,
            glowOpacity: isSelected ? 0.45 : 0,
            isSelected: isSelected ? 1 : 0,
            isRecommended: isRecommended ? 1 : 0,
            distance: r.distance || `${r.distance_km || 0} km`,
            fuel: r.fuel_estimate || r.fuelConsumption || 'N/A',
            risk: r.iceRisk || 'MODERATE'
          },
          geometry: {
            type: 'LineString',
            coordinates: coords
          }
        });
      });
    }

    const routeFeatures: FeatureCollection = {
      type: 'FeatureCollection',
      features: routeFeaturesList
    };

    if (!map.getSource('routes-src')) {
      map.addSource('routes-src', { type: 'geojson', data: routeFeatures });
      map.addLayer({
        id: 'routes-glow',
        type: 'line',
        source: 'routes-src',
        paint: {
          'line-color': ['get', 'color'],
          'line-width': ['get', 'glowWidth'],
          'line-opacity': ['get', 'glowOpacity'],
          'line-blur': 5
        },
        layout: { visibility: layerToggles.recommendedRoute ? 'visible' : 'none' }
      });
      map.addLayer({
        id: 'routes-layer',
        type: 'line',
        source: 'routes-src',
        paint: {
          'line-color': ['get', 'color'],
          'line-width': ['get', 'width'],
          'line-opacity': ['get', 'opacity']
        },
        layout: { visibility: layerToggles.recommendedRoute ? 'visible' : 'none' }
      });

      map.on('click', 'routes-layer', (e) => {
        if (e.features && e.features[0]?.properties?.id) {
          onSelectRoute(e.features[0].properties.id);
        }
      });
    } else {
      const src = map.getSource('routes-src') as GeoJSONSource;
      src.setData(routeFeatures);
      map.setLayoutProperty('routes-glow', 'visibility', layerToggles.recommendedRoute ? 'visible' : 'none');
      map.setLayoutProperty('routes-layer', 'visibility', layerToggles.recommendedRoute ? 'visible' : 'none');
    }

    // =========================================================================
    // D. ICEBERG TRAJECTORY VECTORS (+48H FORECAST, MILESTONE WAYPOINTS & GLOW)
    // =========================================================================
    const effectiveSelectedId = activeSelectedIcebergId || null;
    const icebergLinesFeatures: Feature[] = [];

    activeIcebergs.forEach((ib: any) => {
      const isSelected = effectiveSelectedId === ib.id;
      const isHigh = ib.risk === 'HIGH';
      const color = isSelected ? '#FACC15' : isHigh ? '#EF4444' : '#00F2FE';

      // API returns [lat, lon] arrays — convert to GeoJSON [lon, lat]
      const hist = ib.historicalTrajectory?.map(([lat, lon]: [number, number]) => [lon, lat]) || [];
      const rawPred = ib.predictedTrajectory?.map(([lat, lon]: [number, number]) => [lon, lat]) || [];
      // Origin in GeoJSON [lon, lat] format
      const originLon = ib.origin_longitude ?? ib.longitude;
      const originLat = ib.origin_latitude ?? ib.latitude;
      const origin: [number, number] = [originLon, originLat];

      // Deduplicate: if first predicted point is already the origin (use epsilon for float safety)
      const EPS = 0.0001;
      const firstMatchesOrigin = rawPred.length > 0 &&
        Math.abs(rawPred[0][0] - origin[0]) < EPS &&
        Math.abs(rawPred[0][1] - origin[1]) < EPS;
      const pred = rawPred.length > 0
        ? (firstMatchesOrigin ? rawPred : [origin, ...rawPred])
        : [];

      // Historical track (past 24h) — only for selected iceberg to avoid clutter
      if (hist.length > 1 && isSelected) {
        icebergLinesFeatures.push({
          type: 'Feature',
          properties: { color: '#64748B', isGlow: 0, isFuture: 0, isMilestone: 0 },
          geometry: { type: 'LineString', coordinates: hist }
        });
      }

      // Predicted track (+48h forecast)
      if (pred.length > 1 && (isSelected || isHigh)) {
        if (isSelected) {
          // Luminous outer glow trajectory
          icebergLinesFeatures.push({
            type: 'Feature',
            properties: { color: '#FACC15', isGlow: 1, isFuture: 1, isMilestone: 0 },
            geometry: { type: 'LineString', coordinates: pred }
          });
        }
        // Core trajectory line
        icebergLinesFeatures.push({
          type: 'Feature',
          properties: { color, isGlow: 0, isFuture: 1, isMilestone: 0 },
          geometry: { type: 'LineString', coordinates: pred }
        });
      }

      // Milestone nodes (+6H, +12H, +24H, +48H) for selected iceberg
      if (isSelected && ib.forecastPoints && ib.forecastPoints.length > 1) {
        ib.forecastPoints.forEach((fp: any) => {
          if (fp.horizon !== 'NOW' && fp.coordinates) {
            const isTarget = activeHorizon === fp.horizon;
            // fp.coordinates is [lat, lon] — convert to [lon, lat] for GeoJSON
            const fpLon = fp.coordinates[1];
            const fpLat = fp.coordinates[0];
            if (typeof fpLon === 'number' && typeof fpLat === 'number') {
              icebergLinesFeatures.push({
                type: 'Feature',
                properties: {
                  color: isTarget ? '#FFFFFF' : '#FACC15',
                  radius: isTarget ? 6.5 : 4.0,
                  strokeColor: isTarget ? '#FACC15' : '#040B16',
                  isMilestone: 1,
                  isGlow: 0,
                  isFuture: 0
                },
                geometry: {
                  type: 'Point',
                  coordinates: [fpLon, fpLat]
                }
              });
            }
          }
        });
      }
    });

    const icebergLinesGeoJSON: FeatureCollection = {
      type: 'FeatureCollection',
      features: icebergLinesFeatures
    };

    if (!map.getSource('icebergs-trajectories-src')) {
      map.addSource('icebergs-trajectories-src', { type: 'geojson', data: icebergLinesGeoJSON });

      // 1. Trajectory outer glow (selected iceberg only)
      map.addLayer({
        id: 'icebergs-trajectories-glow',
        type: 'line',
        source: 'icebergs-trajectories-src',
        filter: ['all', ['==', '$type', 'LineString'], ['==', 'isGlow', 1]],
        paint: {
          'line-color': ['get', 'color'],
          'line-width': 7.0,
          'line-opacity': 0.35,
          'line-blur': 4
        },
        layout: { visibility: layerToggles.icebergTrajectories ? 'visible' : 'none' }
      });

      // 2a. Historical track lines (solid, dimmed)
      map.addLayer({
        id: 'icebergs-trajectories-historical',
        type: 'line',
        source: 'icebergs-trajectories-src',
        filter: ['all', ['==', '$type', 'LineString'], ['==', 'isFuture', 0], ['==', 'isGlow', 0]],
        paint: {
          'line-color': ['get', 'color'],
          'line-width': 1.5,
          'line-opacity': 0.55,
          'line-dasharray': [2, 3]
        },
        layout: { visibility: layerToggles.icebergTrajectories ? 'visible' : 'none' }
      });

      // 2b. Predicted trajectory lines (dashed, bright)
      map.addLayer({
        id: 'icebergs-trajectories-lines',
        type: 'line',
        source: 'icebergs-trajectories-src',
        filter: ['all', ['==', '$type', 'LineString'], ['==', 'isFuture', 1], ['==', 'isGlow', 0]],
        paint: {
          'line-color': ['get', 'color'],
          'line-width': 2.2,
          'line-opacity': 0.90,
          'line-dasharray': [3, 2]
        },
        layout: { visibility: layerToggles.icebergTrajectories ? 'visible' : 'none' }
      });

      // 3. Milestone Waypoint Dots (+6H, +12H, +24H, +48H)
      map.addLayer({
        id: 'icebergs-milestone-nodes',
        type: 'circle',
        source: 'icebergs-trajectories-src',
        filter: ['all', ['==', '$type', 'Point'], ['==', 'isMilestone', 1]],
        paint: {
          'circle-radius': ['coalesce', ['get', 'radius'], 4.0],
          'circle-color': ['get', 'color'],
          'circle-stroke-color': ['coalesce', ['get', 'strokeColor'], '#040B16'],
          'circle-stroke-width': 1.8
        },
        layout: { visibility: layerToggles.icebergTrajectories ? 'visible' : 'none' }
      });

    } else {
      const srcLines = map.getSource('icebergs-trajectories-src') as GeoJSONSource;
      if (srcLines) srcLines.setData(icebergLinesGeoJSON);

      const vis = layerToggles.icebergTrajectories ? 'visible' : 'none';
      if (map.getLayer('icebergs-trajectories-glow')) map.setLayoutProperty('icebergs-trajectories-glow', 'visibility', vis);
      if (map.getLayer('icebergs-trajectories-historical')) map.setLayoutProperty('icebergs-trajectories-historical', 'visibility', vis);
      if (map.getLayer('icebergs-trajectories-lines')) map.setLayoutProperty('icebergs-trajectories-lines', 'visibility', vis);
      if (map.getLayer('icebergs-milestone-nodes')) map.setLayoutProperty('icebergs-milestone-nodes', 'visibility', vis);
    }

  }, [
    mapLoaded,
    layerToggles,
    selectedIcebergId,
    activeRouteId,
    smoothIceBandsGeoJSON,
    activeIcebergs,
    currentVesselId,
    vesselRoutes,
    activeVessel?.latitude,
    activeVessel?.longitude,
    oceanCurrentsData,
    activeHorizon,
    onSelectIceberg,
    onSelectRoute,
    activeRouteKey,
    activeRouteObj
  ]);

  // 4. Interactive DOM Markers (Vessels + Waypoints + Destination)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !mapLoaded) return;

    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    // Render Fleet Vessels (Active Vessel is Rank 1 Dominant, Others Muted Rank 6)
    if (layerToggles.activeVessel && fleetVessels.length > 0) {
      fleetVessels.forEach((v) => {
        const isSelected = v.id === currentVesselId;
        if (!isSelected && !layerToggles.otherVessels) return;

        const vesselEl = document.createElement('div');
        vesselEl.className = `vessel-marker-${v.id} vessel-interactive-marker ${isSelected ? 'active-vessel' : ''}`;
        vesselEl.style.width = isSelected ? '56px' : '36px';
        vesselEl.style.height = isSelected ? '56px' : '36px';
        vesselEl.style.display = 'flex';
        vesselEl.style.alignItems = 'center';
        vesselEl.style.justifyContent = 'center';
        vesselEl.style.cursor = 'pointer';
        vesselEl.style.zIndex = isSelected ? '75' : '55';
        vesselEl.style.pointerEvents = 'auto';

        const cleanName = v.name.replace(' — DEMO', '').replace('R/V ', '').replace('RRS ', '').replace('S.A. ', '').split(' (')[0];
        const vSpeed = (v.speed ?? (v as any).sog ?? 13.5);
        const vHeading = v.heading || 180;
        
        if (isSelected) {
          // RANK 1: ACTIVE VESSEL (Bright Cyan/White, Active Beacon Pulse, Heading Vector)
          vesselEl.innerHTML = `
            <div style="position:relative;width:50px;height:50px;display:flex;align-items:center;justify-content:center;pointer-events:none;">
              <div style="position:absolute;width:46px;height:46px;border-radius:50%;background:rgba(0,242,254,0.22);border:1.5px solid #00F2FE;animation:ping 2.5s infinite;pointer-events:none;"></div>
              <div style="width:30px;height:30px;border-radius:50%;background:#040B16;border:2.5px solid #00F2FE;display:flex;align-items:center;justify-content:center;transform:rotate(${vHeading}deg);box-shadow:0 0 20px rgba(0,242,254,0.95);pointer-events:none;">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="#00F2FE" stroke="#FFFFFF" stroke-width="2"><polygon points="12 2 19 21 12 17 5 21 12 2"/></svg>
              </div>
              <span style="position:absolute;bottom:-14px;font-family:monospace;font-size:9.5px;font-weight:bold;color:#00F2FE;background:#040B16;padding:2px 6px;border-radius:3px;border:1px solid #00F2FE;white-space:nowrap;box-shadow:0 0 10px rgba(0,242,254,0.45);pointer-events:none;">
                ★ ${cleanName} • ${vSpeed} kn
              </span>
            </div>`;
        } else {
          // RANK 6: OTHER FLEET VESSELS (Muted Slate, Interactive on Hover & Click)
          vesselEl.innerHTML = `
            <div style="position:relative;width:32px;height:32px;display:flex;align-items:center;justify-content:center;pointer-events:none;" title="${cleanName} (${vSpeed} kn)">
              <div style="width:24px;height:24px;border-radius:50%;background:#0A1322;border:1.5px solid #64748B;display:flex;align-items:center;justify-content:center;transform:rotate(${vHeading}deg);box-shadow:0 0 8px rgba(100,116,139,0.5);pointer-events:none;">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="#94A3B8" stroke="#FFFFFF" stroke-width="1.5"><polygon points="12 2 19 21 12 17 5 21 12 2"/></svg>
              </div>
            </div>`;
        }

        vesselEl.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          handleVesselChange(v.id);
        });

        vesselEl.addEventListener('mouseenter', (e) => {
          setProbeData({
            type: 'VESSEL',
            title: `${v.flag || '⚓'} ${v.name.replace(' — DEMO', '')}`,
            badge: isSelected ? 'ACTIVE VESSEL' : 'FLEET VESSEL',
            badgeColor: isSelected ? '#00F2FE' : '#94A3B8',
            details: [
              { label: 'Polar Class', value: v.polar_class ? v.polar_class.split(' / ')[0] : 'PC5' },
              { label: 'Operator', value: v.operator ? v.operator.split(' (')[0] : (v.country || 'Polar Research') },
              { label: 'Speed & Heading', value: `${vSpeed} kn · ${vHeading}°T` },
              { label: 'Destination', value: v.destination || 'Antarctic Base' },
              { label: 'ETA', value: v.eta || 'En Route' },
              { label: 'Action', value: isSelected ? 'Currently Selected' : '👉 Click to select & frame route' }
            ],
            x: e.clientX,
            y: e.clientY
          });
        });

        vesselEl.addEventListener('mouseleave', () => {
          setProbeData(null);
        });

        const marker = new MapLibreMarker({ element: vesselEl, anchor: 'center' })
          .setLngLat([v.longitude, v.latitude])
          .addTo(map);
        markersRef.current.push(marker);
      });
    }

    // Interactive Waypoints
    if (layerToggles.recommendedRoute && waypoints.length > 0) {
      waypoints.forEach((wp, idx) => {
        const wpLat = wp.latitude ?? (wp as any).lat;
        const wpLon = wp.longitude ?? (wp as any).lon;
        if (typeof wpLat !== 'number' || isNaN(wpLat) || typeof wpLon !== 'number' || isNaN(wpLon)) return;

        const isNearVessel = activeVessel &&
          Math.abs(wpLat - activeVessel.latitude) < 0.08 &&
          Math.abs(wpLon - activeVessel.longitude) < 0.08;

        if (isNearVessel) return;

        const isNearDest = destinationMarker &&
          Math.abs(wpLat - destinationMarker.latitude) < 0.08 &&
          Math.abs(wpLon - destinationMarker.longitude) < 0.08;

        if (isNearDest) return;

        const wpEl = document.createElement('div');
        const isActive = wp.status === 'active';
        const isPassed = wp.status === 'passed';
        const wpColor = isActive ? '#00F2FE' : isPassed ? '#64748B' : '#10B981';
        const dotSize = isActive ? 8 : 6;

        wpEl.className = 'waypoint-marker-root';
        wpEl.title = `Waypoint ${idx + 1} (${wpLat.toFixed(2)}°S, ${wpLon.toFixed(2)}°E)`;
        wpEl.style.width = '14px';
        wpEl.style.height = '14px';
        wpEl.style.display = 'flex';
        wpEl.style.alignItems = 'center';
        wpEl.style.justifyContent = 'center';
        wpEl.style.cursor = 'pointer';

        wpEl.innerHTML = `
          <div style="width:${dotSize}px;height:${dotSize}px;border-radius:50%;background:${wpColor};border:1.5px solid #FFFFFF;box-shadow:0 0 6px ${wpColor};transition:all 0.2s ease;"></div>
        `;

        const marker = new MapLibreMarker({ element: wpEl, anchor: 'center' })
          .setLngLat([wpLon, wpLat])
          .addTo(map);
        markersRef.current.push(marker);
      });
    }

    // Render Destination Station
    if (layerToggles.stations && stations && stations.length > 0) {
      stations.forEach((st) => {
        const isTarget = destinationMarker
          ? Boolean(
              (destinationMarker.name && (destinationMarker.name.toLowerCase().includes(st.name.toLowerCase()) || st.name.toLowerCase().includes(destinationMarker.name.toLowerCase()))) ||
              (Math.abs(st.latitude - (destinationMarker.latitude ?? (destinationMarker as any).lat ?? 999)) < 0.3 &&
               Math.abs(st.longitude - (destinationMarker.longitude ?? (destinationMarker as any).lon ?? 999)) < 0.6)
            )
          : Boolean(
              activeVessel?.destination && (
                activeVessel.destination.toLowerCase().includes(st.name.toLowerCase()) ||
                st.name.toLowerCase().includes(activeVessel.destination.toLowerCase())
              )
            );

        const stEl = document.createElement('div');
        stEl.className = `station-marker-${st.id}`;
        stEl.style.cursor = 'pointer';

        if (isTarget) {
          stEl.innerHTML = `
            <div style="position:relative;width:40px;height:40px;display:flex;align-items:center;justify-content:center;">
              <div style="position:absolute;width:36px;height:36px;border-radius:50%;background:rgba(16,185,129,0.25);border:1.5px solid #10B981;animation:ping 2s infinite;"></div>
              <div style="width:24px;height:24px;border-radius:50%;background:#040B16;border:2px solid #10B981;display:flex;align-items:center;justify-content:center;box-shadow:0 0 14px #10B981;">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="#10B981" stroke="#FFFFFF" stroke-width="2"><circle cx="12" cy="12" r="6"/></svg>
              </div>
              <span style="position:absolute;top:32px;left:50%;transform:translateX(-50%);font-family:monospace;font-size:9px;font-weight:bold;color:#10B981;background:#040B16;padding:2px 6px;border-radius:4px;border:1px solid #10B981;white-space:nowrap;pointer-events:none;box-shadow:0 0 8px rgba(16,185,129,0.4);">
                ★ ${st.name} (${st.country ? st.country.slice(0, 2).toUpperCase() : 'AQ'})
              </span>
            </div>`;
        } else {
          stEl.innerHTML = `
            <div style="position:relative;width:24px;height:24px;display:flex;align-items:center;justify-content:center;opacity:0.75;" title="${st.name}">
              <div style="width:10px;height:10px;border-radius:50%;background:#040B16;border:1.2px solid #38BDF8;display:flex;align-items:center;justify-content:center;">
                <svg width="5" height="5" viewBox="0 0 24 24" fill="#38BDF8"><polygon points="12 2 2 22 22 22"/></svg>
              </div>
            </div>`;
        }

        const marker = new MapLibreMarker({ element: stEl, anchor: 'center' })
          .setLngLat([st.longitude, st.latitude])
          .addTo(map);
        markersRef.current.push(marker);
      });
    }

    // =========================================================================
    // 4D. TACTICAL ICEBERG DOM MARKERS (Zoom-Adaptive Scaled Diamonds & Smart Decluttering)
    // =========================================================================
    if (layerToggles.icebergs && activeIcebergs && activeIcebergs.length > 0) {
      const isZoomLow = mapZoomRef.current < 4.2;
      const isZoomMed = mapZoomRef.current >= 4.2 && mapZoomRef.current < 5.6;
      const isZoomHigh = mapZoomRef.current >= 5.6;

      activeIcebergs.forEach((ib: any) => {
        const lon = ib.origin_longitude ?? ib.longitude;
        const lat = ib.origin_latitude ?? ib.latitude;
        if (typeof lon !== 'number' || typeof lat !== 'number' || isNaN(lon) || isNaN(lat)) return;

        const isSelected = activeSelectedIcebergId === ib.id;
        const isHigh = ib.risk === 'HIGH';
        const isCaution = ib.risk === 'CAUTION';
        const color = isHigh ? '#EF4444' : isCaution ? '#F59E0B' : '#00F2FE';
        const area = ib.areaKm2 || 45;
        const isGiant = area >= 100;
        const isLarge = area >= 50 && area < 100;

        // Dynamic diamond size scaled by zoom level & area:
        // - Low zoom (<4.2): Sleek pinpoint radar pips (5px - 7px), Selected is 16px
        // - Med zoom (4.2-5.6): Clean diamonds (9px - 13px), Selected is 22px
        // - High zoom (>=5.6): Full tactical diamonds (13px - 22px), Selected is 28px
        const diamondSize = isZoomLow
          ? (isSelected ? 16 : isHigh ? 7 : 5)
          : isZoomMed
          ? (isSelected ? 22 : isHigh ? 13 : isGiant ? 13 : 9)
          : (isSelected ? 28 : isGiant ? 22 : isLarge ? 17 : 13);

        const innerDiamondSize = Math.max(2, Math.round(diamondSize * 0.62));

        // Heading needle visibility
        const showNeedle = isSelected || isZoomHigh || (isZoomMed && isHigh);
        const bearingStr = ib.direction || '0°T';
        const bearingDeg = parseFloat(bearingStr) || (ib.forecastPoints?.[1]?.bearingDeg ?? 90);

        // Smart Label Filtering:
        // - Low zoom (<4.2): ONLY selected iceberg shows label (prevents 85 overlapping black boxes)
        // - Medium zoom (4.2-5.6): Selected AND High-Threat icebergs show compact ID label
        // - High zoom (>=5.6): All icebergs show tactical labels
        const showLabel = isSelected || isZoomHigh || (isZoomMed && isHigh);
        const labelText = (isSelected || isZoomHigh)
          ? `${ib.id} ${isSelected || isHigh ? `• ${(ib.velocity || 0.4).toFixed(1)}kn` : ''}`
          : ib.id;

        const ibEl = document.createElement('div');
        ibEl.className = `iceberg-marker-node iceberg-marker-node-${ib.id} ${isSelected ? 'selected' : ''}`;
        ibEl.dataset.id = ib.id;
        ibEl.dataset.isSelected = isSelected ? '1' : '0';
        ibEl.dataset.risk = ib.risk || 'SAFE';
        // Note: ibEl must NOT have position: relative - MapLibre uses absolute positioning on markers!
        ibEl.style.width = `${diamondSize + 12}px`;
        ibEl.style.height = `${diamondSize + 12}px`;
        ibEl.style.display = 'flex';
        ibEl.style.alignItems = 'center';
        ibEl.style.justifyContent = 'center';
        ibEl.style.cursor = 'pointer';
        ibEl.style.zIndex = isSelected ? '35' : isHigh ? '25' : '10';

        ibEl.innerHTML = `
          <div style="position:relative;width:100%;height:100%;display:flex;align-items:center;justify-content:center;">
            ${isSelected ? `
              <div style="position:absolute;width:${diamondSize + 12}px;height:${diamondSize + 12}px;border-radius:50%;background:${color}22;border:1.5px solid ${color};animation:ping 2s infinite;pointer-events:none;"></div>
            ` : ''}

            <!-- 45-deg Rotated Diamond Iceberg Symbol -->
            <div class="iceberg-diamond-symbol" style="
              width:${diamondSize}px;
              height:${diamondSize}px;
              transform:rotate(45deg);
              background:${isSelected ? '#FFFFFF' : '#040B16'};
              border:${isSelected ? '2.5px solid #FACC15' : isZoomLow ? '1px solid #FFFFFF' : `1.8px solid ${color}`};
              border-radius:${isZoomLow ? '1px' : '2px'};
              display:flex;
              align-items:center;
              justify-content:center;
              box-shadow:0 0 ${isSelected ? '12px rgba(250,204,21,0.9)' : isHigh ? '6px rgba(239,68,68,0.6)' : '3px rgba(0,242,254,0.3)'};
            ">
              <div class="iceberg-diamond-inner" style="
                width:${innerDiamondSize}px;
                height:${innerDiamondSize}px;
                background:${isSelected ? '#FACC15' : color};
                opacity:0.95;
              "></div>
            </div>

            <!-- Directional Drift Pointer Arrow (Medium / High Zoom only) -->
            ${showNeedle ? `
              <div style="
                position:absolute;
                width:100%;
                height:100%;
                pointer-events:none;
                transform:rotate(${bearingDeg}deg);
                display:flex;
                align-items:center;
                justify-content:center;
              ">
                <div style="
                  position:absolute;
                  top:-5px;
                  width:0;
                  height:0;
                  border-left:3px solid transparent;
                  border-right:3px solid transparent;
                  border-bottom:5px solid ${isSelected ? '#FACC15' : color};
                  filter:drop-shadow(0 0 2px ${color});
                "></div>
              </div>
            ` : ''}

            <!-- Tactical Label Badge (Zoom-Adaptive) -->
            ${showLabel ? `
              <span class="iceberg-label-badge" style="
                position:absolute;
                bottom:-15px;
                left:50%;
                transform:translateX(-50%);
                font-family:ui-monospace, monospace;
                font-size:${isSelected ? '9.5px' : isZoomHigh ? '8px' : '7.5px'};
                font-weight:bold;
                color:${isSelected ? '#FACC15' : '#FFFFFF'};
                background:#040B16;
                padding:1px ${isSelected ? '4px' : '3px'};
                border-radius:2px;
                border:1px solid ${isSelected ? '#FACC15' : `${color}55`};
                white-space:nowrap;
                box-shadow:0 2px 6px rgba(0,0,0,0.8);
                pointer-events:none;
              ">
                ${labelText}
              </span>
            ` : ''}
          </div>
        `;

        ibEl.addEventListener('click', (e) => {
          e.stopPropagation();
          handleIcebergSelect(ib.id);
        });

        ibEl.addEventListener('mouseenter', (e) => {
          setProbeData({
            type: 'ICEBERG',
            title: `Iceberg ${ib.id} (${ib.name || 'Shelf Fragment'})`,
            badge: ib.risk || 'CAUTION',
            badgeColor: color,
            details: [
              { label: 'Surface Area', value: `${area} km² ${isGiant ? '(Giant Tabular)' : ''}` },
              { label: 'Drift Speed', value: `${ib.velocity || 0.42} kn (${bearingStr})` },
              { label: 'Draft Estimate', value: `${ib.draftEstimate || 320} m keel depth` },
              { label: 'Confidence', value: `${ib.confidence || 94.8}%` },
              { label: 'Coordinates', value: `${Math.abs(Number(lat.toFixed(2)))}°S, ${Math.abs(Number(lon.toFixed(2)))}°${lon >= 0 ? 'E' : 'W'}` },
              { label: 'Sensor Source', value: ib.sensorSource || 'BYU/NIC Polar MERS Radar' }
            ],
            x: e.clientX,
            y: e.clientY
          });
        });

        ibEl.addEventListener('mouseleave', () => {
          setProbeData(null);
        });

        const marker = new MapLibreMarker({ element: ibEl, anchor: 'center' })
          .setLngLat([lon, lat])
          .addTo(map);
        markersRef.current.push(marker);
      });
    }

  }, [
    mapLoaded,
    layerToggles,
    fleetVessels,
    currentVesselId,
    destinationMarker,
    waypoints,
    stations,
    activeVessel,
    activeIcebergs,
    activeSelectedIcebergId,
    onSelectIceberg
  ]);

  // 5. Zoom-adaptive marker styling (NO teardown/recreate — updates DOM in-place)
  useEffect(() => {
    // Use mapZoom state directly (not the ref, which can be stale)
    const z = mapZoom;
    const isLow = z < 4.2;
    const isMed = z >= 4.2 && z < 5.6;
    const isHigh = z >= 5.6;

    markersRef.current.forEach(m => {
      const el = m.getElement();
      if (!el) return;

      if (!el.classList.contains('iceberg-marker-node')) return;

      const ibDiamond = el.querySelector('.iceberg-diamond-symbol') as HTMLElement | null;
      if (!ibDiamond) return;

      const isSel = el.dataset.isSelected === '1' || el.classList.contains('selected');
      const isHighRisk = el.dataset.risk === 'HIGH';
      const ibInner = el.querySelector('.iceberg-diamond-inner') as HTMLElement | null;
      const ibLabel = el.querySelector('.iceberg-label-badge') as HTMLElement | null;

      let newSize: number;
      if (isLow) {
        newSize = isSel ? 18 : isHighRisk ? 7 : 5;
      } else if (isMed) {
        newSize = isSel ? 24 : isHighRisk ? 13 : 9;
      } else {
        newSize = isSel ? 28 : isHighRisk ? 18 : 13;
      }
      ibDiamond.style.width = `${newSize}px`;
      ibDiamond.style.height = `${newSize}px`;

      if (ibInner) {
        const innerSize = Math.max(2, Math.round(newSize * 0.62));
        ibInner.style.width = `${innerSize}px`;
        ibInner.style.height = `${innerSize}px`;
      }

      // Update label visibility based on zoom level
      if (ibLabel) {
        ibLabel.style.display = (isSel || isHigh || (isMed && isHighRisk)) ? '' : 'none';
      }
    });
  }, [mapZoom]);

  return (
    <div className="w-full h-full bg-[#040B16] relative z-0 overflow-hidden select-none">
      {/* MAP CANVAS */}
      <div ref={mapContainerRef} className="w-full h-full" style={{ background: '#040B16' }} />



      {/* ========================================================================= */}
      {/* 1. TOP-CENTER VIEWPORT SWITCHER (OPERATIONAL VS CIRCUMPOLAR)               */}
      {/* ========================================================================= */}
      <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 flex items-center bg-[#040B16]/90 backdrop-blur-md rounded-full border border-slate-700/60 p-1 shadow-lg font-mono text-[11px]">
        <button
          type="button"
          onClick={() => handleViewportSwitch('OPERATIONAL')}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-full transition-all ${
            viewportMode === 'OPERATIONAL'
              ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/60 shadow-[0_0_10px_rgba(0,242,254,0.3)]'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Crosshair className="w-3.5 h-3.5 text-cyan-400" />
          <span>OPERATIONAL SECTOR</span>
        </button>
        <button
          type="button"
          onClick={() => handleViewportSwitch('CIRCUMPOLAR')}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-full transition-all ${
            viewportMode === 'CIRCUMPOLAR'
              ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/60 shadow-[0_0_10px_rgba(0,242,254,0.3)]'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Globe className="w-3.5 h-3.5 text-cyan-400" />
          <span>CIRCUMPOLAR VIEW</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* 2. TOP-RIGHT FLOATING LAYERS CONTROL HUD                                  */}
      {/* ========================================================================= */}
      <div className="absolute top-3 right-3 z-30 font-mono text-xs">
        <button
          type="button"
          onClick={() => setLayersMenuOpen(!layersMenuOpen)}
          className="flex items-center gap-2 bg-[#040B16]/95 backdrop-blur-md border border-slate-700/80 px-3 py-1.5 rounded-lg text-slate-200 hover:text-cyan-300 hover:border-cyan-500/60 transition-all shadow-xl"
        >
          <Layers className="w-3.5 h-3.5 text-cyan-400" />
          <span className="font-bold text-[11px]">LAYERS</span>
          {layersMenuOpen ? <ChevronUp className="w-3 h-3 text-slate-400" /> : <ChevronDown className="w-3 h-3 text-slate-400" />}
        </button>

        {layersMenuOpen && (
          <div className="absolute right-0 mt-2 w-64 bg-[#040B16]/98 backdrop-blur-xl border border-slate-700/80 rounded-xl p-3 shadow-2xl space-y-3 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
              <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                <Compass className="w-3 h-3" /> MAP DISPLAY HIERARCHY
              </span>
              <button type="button" onClick={() => setLayersMenuOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-3 h-3" />
              </button>
            </div>

            {/* Navigation Group */}
            <div className="space-y-1.5">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                <Ship className="w-2.5 h-2.5 text-cyan-400" /> NAVIGATION
              </span>
              <label className="flex items-center justify-between text-[11px] text-slate-300 hover:text-white cursor-pointer">
                <span>Active Vessel (Rank 1)</span>
                <input
                  type="checkbox"
                  checked={layerToggles.activeVessel}
                  onChange={(e) => setLayerToggles({ ...layerToggles, activeVessel: e.target.checked })}
                  className="rounded bg-slate-900 border-slate-700 text-cyan-500 focus:ring-0"
                />
              </label>
              <label className="flex items-center justify-between text-[11px] text-slate-300 hover:text-white cursor-pointer">
                <span>Other Vessels (Rank 6)</span>
                <input
                  type="checkbox"
                  checked={layerToggles.otherVessels}
                  onChange={(e) => setLayerToggles({ ...layerToggles, otherVessels: e.target.checked })}
                  className="rounded bg-slate-900 border-slate-700 text-cyan-500 focus:ring-0"
                />
              </label>
              <label className="flex items-center justify-between text-[11px] text-slate-300 hover:text-white cursor-pointer">
                <span>Recommended Route (Rank 2)</span>
                <input
                  type="checkbox"
                  checked={layerToggles.recommendedRoute}
                  onChange={(e) => setLayerToggles({ ...layerToggles, recommendedRoute: e.target.checked })}
                  className="rounded bg-slate-900 border-slate-700 text-cyan-500 focus:ring-0"
                />
              </label>
              <label className="flex items-center justify-between text-[11px] text-slate-300 hover:text-white cursor-pointer">
                <span>Alternative Routes (Rank 5)</span>
                <input
                  type="checkbox"
                  checked={layerToggles.altRoutes}
                  onChange={(e) => setLayerToggles({ ...layerToggles, altRoutes: e.target.checked })}
                  className="rounded bg-slate-900 border-slate-700 text-cyan-500 focus:ring-0"
                />
              </label>
            </div>

            {/* Hazards Group */}
            <div className="space-y-1.5 pt-1 border-t border-slate-800/80">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                <ShieldAlert className="w-2.5 h-2.5 text-rose-400" /> HAZARDS
              </span>
              <label className="flex items-center justify-between text-[11px] text-slate-300 hover:text-white cursor-pointer">
                <span>Icebergs & Clusters (Rank 3)</span>
                <input
                  type="checkbox"
                  checked={layerToggles.icebergs}
                  onChange={(e) => setLayerToggles({ ...layerToggles, icebergs: e.target.checked })}
                  className="rounded bg-slate-900 border-slate-700 text-cyan-500 focus:ring-0"
                />
              </label>
              <label className="flex items-center justify-between text-[11px] text-slate-300 hover:text-white cursor-pointer">
                <span>48h Drift Trajectories</span>
                <input
                  type="checkbox"
                  checked={layerToggles.icebergTrajectories}
                  onChange={(e) => setLayerToggles({ ...layerToggles, icebergTrajectories: e.target.checked })}
                  className="rounded bg-slate-900 border-slate-700 text-cyan-500 focus:ring-0"
                />
              </label>
            </div>

            {/* Environment Group */}
            <div className="space-y-1.5 pt-1 border-t border-slate-800/80">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                <Waves className="w-2.5 h-2.5 text-blue-400" /> ENVIRONMENT
              </span>
              <label className="flex items-center justify-between text-[11px] text-slate-300 hover:text-white cursor-pointer">
                <span>Sea Ice (Rank 4 Background)</span>
                <input
                  type="checkbox"
                  checked={layerToggles.seaIce}
                  onChange={(e) => setLayerToggles({ ...layerToggles, seaIce: e.target.checked })}
                  className="rounded bg-slate-900 border-slate-700 text-cyan-500 focus:ring-0"
                />
              </label>
              <label className="flex items-center justify-between text-[11px] text-slate-300 hover:text-white cursor-pointer">
                <span>Surface Ocean Currents (GLO12)</span>
                <input
                  type="checkbox"
                  checked={layerToggles.oceanCurrents}
                  onChange={(e) => setLayerToggles({ ...layerToggles, oceanCurrents: e.target.checked })}
                  className="rounded bg-slate-900 border-slate-700 text-cyan-500 focus:ring-0"
                />
              </label>
              <label className="flex items-center justify-between text-[11px] text-slate-300 hover:text-white cursor-pointer">
                <span>COMNAP Research Stations</span>
                <input
                  type="checkbox"
                  checked={layerToggles.stations}
                  onChange={(e) => setLayerToggles({ ...layerToggles, stations: e.target.checked })}
                  className="rounded bg-slate-900 border-slate-700 text-cyan-500 focus:ring-0"
                />
              </label>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 3. UNIFIED HOVER PROBE CARD                                               */}
      {/* ========================================================================= */}
      {probeData && (
        <div 
          className="absolute z-40 pointer-events-none bg-[#040B16]/95 backdrop-blur-md border border-cyan-400/80 rounded-xl p-3 shadow-[0_0_25px_rgba(0,242,254,0.35)] font-mono text-xs w-64 space-y-1.5 transition-all"
          style={{
            left: Math.min(window.innerWidth - 280, Math.max(20, probeData.x + 15)),
            top: Math.min(window.innerHeight - 200, Math.max(20, probeData.y - 30))
          }}
        >
          <div className="flex items-center justify-between border-b border-slate-800 pb-1">
            <span className="text-[10px] text-cyan-400 font-bold">{probeData.title}</span>
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ color: probeData.badgeColor, backgroundColor: `${probeData.badgeColor}22` }}>
              {probeData.badge}
            </span>
          </div>
          <div className="space-y-1 text-[10px]">
            {probeData.details.map((d, i) => (
              <div key={i} className="flex items-center justify-between">
                <span className="text-slate-400">{d.label}:</span>
                <strong className="text-slate-200">{d.value}</strong>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. BOTTOM-LEFT COLLAPSIBLE MARITIME LEGEND                                 */}
      {/* ========================================================================= */}
      <div className="absolute bottom-4 left-4 z-20 font-mono text-xs">
        {legendCollapsed ? (
          <button
            type="button"
            onClick={() => setLegendCollapsed(false)}
            className="flex items-center gap-1.5 bg-[#040B16]/90 backdrop-blur-md border border-slate-700/80 px-2.5 py-1.5 rounded-lg text-slate-300 hover:text-white shadow-lg text-[10px] font-bold"
          >
            <Compass className="w-3 h-3 text-cyan-400" />
            <span>LEGEND</span>
            <ChevronUp className="w-3 h-3" />
          </button>
        ) : (
          <div className="bg-[#040B16]/95 backdrop-blur-md rounded-xl border border-slate-700/80 p-3 shadow-2xl w-60 space-y-2 select-none animate-in fade-in">
            <div className="flex items-center justify-between border-b border-slate-800 pb-1">
              <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                <Compass className="w-3 h-3" /> OPERATIONAL LEGEND
              </span>
              <button type="button" onClick={() => setLegendCollapsed(true)} className="text-slate-400 hover:text-white">
                <ChevronDown className="w-3 h-3" />
              </button>
            </div>

            {/* Sea Ice WMO */}
            <div className="space-y-1 text-[9px]">
              <span className="text-[8.5px] font-bold text-slate-400 uppercase tracking-widest">SEA ICE (WMO)</span>
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-sm bg-[#BCEEFA] border border-white" />
                <span className="text-slate-200 font-bold">80–100% Fast Ice</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-sm bg-[#00D8F6] border border-cyan-400" />
                <span className="text-cyan-300">50–80% Pack Ice</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-sm bg-[#0284C7] border border-cyan-600" />
                <span className="text-slate-400">15–50% Marginal Ice</span>
              </div>
            </div>

            {/* Hazards & Icebergs */}
            <div className="space-y-1 text-[9px] pt-1 border-t border-slate-800/80">
              <span className="text-[8.5px] font-bold text-slate-400 uppercase tracking-widest">ICEBERG THREAT LEVELS</span>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-rose-400">
                  <span className="w-2 h-2 rounded-full bg-[#EF4444] inline-block" /> High Threat
                </span>
                <span className="flex items-center gap-1.5 text-amber-400">
                  <span className="w-2 h-2 rounded-full bg-[#F59E0B] inline-block" /> Caution
                </span>
                <span className="flex items-center gap-1.5 text-cyan-400">
                  <span className="w-2 h-2 rounded-full bg-[#38BDF8] inline-block" /> Safe
                </span>
              </div>
            </div>

            {/* Routes & Vessels */}
            <div className="space-y-1 text-[9px] pt-1 border-t border-slate-800/80">
              <span className="text-[8.5px] font-bold text-slate-400 uppercase tracking-widest">ROUTES & FLEET</span>
              <div className="flex items-center gap-2">
                <span className="text-emerald-400 font-bold">━━━━</span>
                <span className="text-emerald-400 font-bold">Recommended Corridor</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-slate-400 font-bold">- - -</span>
                <span className="text-slate-400">Alternative Corridor</span>
              </div>
            </div>

            <div className="text-[8px] text-slate-400 pt-1 border-t border-slate-800/80">
              Real Data: NOAA/NSIDC CDR V4 • Copernicus GLO12 • BYU/NIC
            </div>
          </div>
        )}
      </div>


    </div>
  );
};

export default PolarMap;
