import { useEffect, useState } from 'react'
type Usage=Awaited<ReturnType<NonNullable<NonNullable<Window['overwatch']>['getResourceUsage']>>>
export function ResourceReadout() {
  const [usage,setUsage]=useState<Usage>()
  const [error,setError]=useState('')
  useEffect(()=>{
    let active=true
    const sample=()=>{const read=window.overwatch?.getResourceUsage;if(!read){setError('Resource metrics require the updated desktop app.');return}void read().then(value=>{if(active)setUsage(value)},()=>{if(active)setError('Resource metrics are unavailable.')})}
    sample();const timer=window.setInterval(sample,5000)
    return ()=>{active=false;window.clearInterval(timer)}
  },[])
  return <section aria-label="Overwatch resource usage"><h3>Resources</h3>{error?<p>{error}</p>:usage?<><p>App process RAM: {usage.rssMiB.toFixed(0)} MiB (summed RSS; shared pages can be counted twice). CPU: {usage.sampleSeconds>0?`${usage.cpuPercent.toFixed(1)}%`:'sampling…'}. WebGL 2: {usage.gpu}.</p><p>System RAM: {(usage.systemTotalMiB/1024).toFixed(1)} GiB; available {(usage.systemAvailableMiB/1024).toFixed(1)} GiB.{usage.swapUsedMiB!==undefined?` Swap in use: ${(usage.swapUsedMiB/1024).toFixed(1)} GiB.`:''}</p><details><summary>Process breakdown</summary>{usage.processes.map(process=><p key={process.pid}>{process.type}: {process.rssMiB.toFixed(0)} MiB · {process.cpuPercent.toFixed(1)}% CPU</p>)}</details><small>Updates every 5 seconds while Settings is open. GPU process RAM is included; GPU utilization and video memory are not measured.</small></>:<p>Sampling resource use…</p>}</section>
}
