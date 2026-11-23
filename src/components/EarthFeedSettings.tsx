import { useMemo, useState } from 'react'
import { earthDocumentCategories, earthFeedModes, defaultEarthFeedOptions, type EarthFeedOptions, type EarthFeedMode } from '../domain/earthFeed'
import type { IntelligenceDocument } from '../domain/intelligence'
import './EarthFeedSettings.css'
import { ResourceReadout } from './ResourceReadout'
export function EarthFeedSettings({mode,documents,onChange,options=defaultEarthFeedOptions,onOptionsChange}:{options?:EarthFeedOptions;onOptionsChange?(options:EarthFeedOptions):void;mode:EarthFeedMode;documents:readonly IntelligenceDocument[];onChange(mode:EarthFeedMode):void}) {
  const [open,setOpen]=useState(false)
  const counts=useMemo(()=>documents.reduce((total,document)=>{const categories=earthDocumentCategories(document);if(!categories.length)total.unclassified+=1;for(const category of categories)if(category!=='all')total[category]+=1;return total},{all:documents.length,science:0,politics:0,unclassified:0}),[documents])
  return <details className="earth-feed-settings" onToggle={event=>setOpen(event.currentTarget.open)}>
    <summary>Earth view: {earthFeedModes.find(item=>item.id===mode)?.label} · Settings</summary>
    <fieldset><legend>Evidence shown on Earth</legend>{earthFeedModes.map(item=><label key={item.id}><input type="radio" name="earth-feed-mode" value={item.id} checked={mode===item.id} onChange={()=>onChange(item.id)}/>{item.label}<small>{counts[item.id]}</small></label>)}</fieldset>
    {onOptionsChange && <fieldset><legend>Feed volume</legend>
      <label><input type="checkbox" checked={options.includeArchives} onChange={event=>onOptionsChange({...options,includeArchives:event.target.checked})}/>Include bulk space archives in All evidence</label>
      <label><input type="checkbox" checked={options.hideTests} onChange={event=>onOptionsChange({...options,hideTests:event.target.checked})}/>Hide test/demo sources</label>
      <label><input type="checkbox" checked={options.collapseRepeats} onChange={event=>onOptionsChange({...options,collapseRepeats:event.target.checked})}/>Collapse repeated records</label>
      <label>Records per source<select value={options.perSourceLimit} onChange={event=>onOptionsChange({...options,perSourceLimit:Number(event.target.value)})}><option value={10}>10</option><option value={25}>25</option><option value={100}>100</option><option value={0}>No display limit</option></select></label>
      <small>Display limits preserve the underlying records. Category counts show retained records before display limits.</small>
    </fieldset>}
    <p>Applies to the feed, map markers, and regional dossiers. Categories use source metadata and keywords; mixed stories may appear in both views. {counts.unclassified} unclassified record(s) remain available in All evidence.</p>
    {open && <ResourceReadout/>}
  </details>
}
