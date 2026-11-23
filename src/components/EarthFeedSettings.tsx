import { useMemo } from 'react'
import { earthDocumentCategories, earthFeedModes, type EarthFeedMode } from '../domain/earthFeed'
import type { IntelligenceDocument } from '../domain/intelligence'
import './EarthFeedSettings.css'
export function EarthFeedSettings({mode,documents,onChange}:{mode:EarthFeedMode;documents:readonly IntelligenceDocument[];onChange(mode:EarthFeedMode):void}) {
  const counts=useMemo(()=>documents.reduce((total,document)=>{const categories=earthDocumentCategories(document);if(!categories.length)total.unclassified+=1;for(const category of categories)if(category!=='all')total[category]+=1;return total},{all:documents.length,science:0,politics:0,unclassified:0}),[documents])
  return <details className="earth-feed-settings">
    <summary>Earth view: {earthFeedModes.find(item=>item.id===mode)?.label} · Settings</summary>
    <fieldset><legend>Evidence shown on Earth</legend>{earthFeedModes.map(item=><label key={item.id}><input type="radio" name="earth-feed-mode" value={item.id} checked={mode===item.id} onChange={()=>onChange(item.id)}/>{item.label}<small>{counts[item.id]}</small></label>)}</fieldset>
    <p>Applies to the feed, map markers, and regional dossiers. Categories use source metadata and keywords; mixed stories may appear in both views. {counts.unclassified} unclassified record(s) remain available in All evidence.</p>
  </details>
}
