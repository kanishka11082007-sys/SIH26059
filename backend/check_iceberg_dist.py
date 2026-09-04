from app.data_transformer import get_vessels, get_routes, get_icebergs
import math

vessels = get_vessels()
icebergs = get_icebergs()

def dist_km(lat1, lon1, lat2, lon2):
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat/2)**2 + math.cos(math.radians(lat1))*math.cos(math.radians(lat2))*math.sin(dlon/2)**2
    return 6371 * 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))

for v in vessels:
    routes = get_routes(vessel_id=v['id'])
    if not routes: continue
    path = routes[0]['path']
    min_d = 9999
    closest_ib = None
    for ib in icebergs:
        for pt in path:
            d = dist_km(pt[0], pt[1], ib['latitude'], ib['longitude'])
            if d < min_d:
                min_d = d
                closest_ib = ib
    print(f"{v['id']}: closest iceberg is {closest_ib['id']} ({closest_ib['name']}) at {min_d:.1f} km from route")
