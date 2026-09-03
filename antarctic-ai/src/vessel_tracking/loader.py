"""Load real historical Antarctic vessel tracks from AAD data."""
import os
import glob
import pandas as pd
import numpy as np

VOYAGE_NAMES = {
    '201516020': 'Aurora Australis V2 2015/16',
    '201718030': 'Aurora Australis V3 2017/18',
    '201011040': 'Aurora Australis V4 2010/11',
    '201819020': 'Aurora Australis V2 2018/19',
    '200809020': 'Aurora Australis V2 2008/09',
}


def load_vessel_tracks(data_dir=None):
    """Load all vessel track data from CSV files."""
    if data_dir is None:
        data_dir = os.path.join(
            os.path.dirname(__file__), '..', '..', 'data', 'raw', 'vessel_tracks'
        )
    
    csv_files = sorted(glob.glob(os.path.join(data_dir, 'voyage_*.csv')))
    orig = os.path.join(data_dir, 'aurora_australis_2015_16.csv')
    if os.path.exists(orig):
        csv_files = [orig] + csv_files
    
    all_tracks = []
    for csv_path in csv_files:
        try:
            df = pd.read_csv(csv_path)
            set_code = str(df['set_code'].iloc[0])
            
            records = []
            for _, row in df.iterrows():
                lat, lon = row.get('latitude'), row.get('longitude')
                if pd.isna(lat) or pd.isna(lon):
                    continue
                if not (-90 <= lat <= 0) or not (-180 <= lon <= 180):
                    continue
                records.append({
                    'vessel_id': set_code,
                    'vessel_name': VOYAGE_NAMES.get(set_code, f'Voyage {set_code}'),
                    'timestamp': pd.to_datetime(row.get('date_time_utc')),
                    'latitude': float(lat),
                    'longitude': float(lon),
                    'speed_knots': float(row['ship_spd_over_ground_knot']) if pd.notna(row.get('ship_spd_over_ground_knot')) else None,
                    'heading_deg': float(row['ship_heading_gps_deg']) if pd.notna(row.get('ship_heading_gps_deg')) else None,
                    'course_deg': float(row['ship_course_over_ground_deg']) if pd.notna(row.get('ship_course_over_ground_deg')) else None,
                    'source': 'Australian Antarctic Data Centre (AAD)',
                    'data_type': 'historical_vessel_track'
                })
            
            if records:
                tracks = pd.DataFrame(records)
                tracks = tracks.sort_values('timestamp').drop_duplicates(subset=['vessel_id', 'timestamp']).reset_index(drop=True)
                all_tracks.append(tracks)
        except Exception as e:
            print(f"Warning: Failed to load {csv_path}: {e}")
    
    if all_tracks:
        return pd.concat(all_tracks, ignore_index=True)
    return pd.DataFrame()


def get_vessel_list(tracks):
    """Get list of unique vessels in the dataset."""
    return tracks.groupby('vessel_id').agg({
        'vessel_name': 'first',
        'timestamp': ['min', 'max', 'count'],
        'latitude': ['min', 'max'],
        'longitude': ['min', 'max']
    }).reset_index()


def get_track(tracks, vessel_id):
    """Get full track for a specific vessel, sorted by time."""
    t = tracks[tracks['vessel_id'] == str(vessel_id)].copy()
    return t.sort_values('timestamp').reset_index(drop=True)


def get_latest_position(tracks, vessel_id):
    """Get the latest (most recent) position of a vessel."""
    t = get_track(tracks, vessel_id)
    if len(t) == 0:
        return None
    return t.iloc[-1].to_dict()


def get_position_at_time(tracks, vessel_id, timestamp):
    """Get vessel position closest to a given timestamp."""
    t = get_track(tracks, vessel_id)
    if len(t) == 0:
        return None
    ts = pd.to_datetime(timestamp)
    idx = (t['timestamp'] - ts).abs().idxmin()
    return t.iloc[idx].to_dict()


def get_track_coords(tracks, vessel_id):
    """Get track as list of [lat, lon] for map visualization."""
    t = get_track(tracks, vessel_id)
    return t[['latitude', 'longitude']].values.tolist()
