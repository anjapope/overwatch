import { nearbyWorlds, orbitalContextEpoch } from '../domain/orbitalContext'
import './NearbyWorldLinks.css'
export function NearbyWorldLinks({bodyId,onNavigate}:{bodyId:string;onNavigate(id:string):void}) {
  const worlds=nearbyWorlds(bodyId)
  if(!worlds.length)return null
  return <nav className="nearby-world-links" aria-label="Nearby world profiles"><h3>Nearby worlds</h3><p>Relative distances at {orbitalContextEpoch}; not live positions.</p><div>{worlds.map(world=><button key={world.body.id} onClick={()=>onNavigate(world.body.id)}><strong>{world.body.name}</strong><small>{Math.round(world.distanceKm).toLocaleString()} km center to center</small></button>)}</div></nav>
}
