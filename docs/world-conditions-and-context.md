# World conditions, Earth lenses, and orbital context

Every atlas entry includes temperature and atmospheric readouts, independent of
MERLIN availability. The data and sources are in `src/content/bodyConditions.json`.
Reference means, local values, ranges, stellar photosphere and giant-planet 1-bar
levels are labeled separately. Many small-body entries use an explicitly labeled
zero-albedo equilibrium calculation, **not an observed surface average**. The model
is T = 278.3 K / sqrt(r/AU), at nominal orbital distance, unit emissivity and uniform
heat redistribution. It excludes greenhouse effects, internal heating and thermal
inertia; an eccentric object's actual temperature can be very different. Atmospheric
non-detection does not exclude a transient exosphere. Comae are not stable atmospheres.
Regions have no single temperature or atmospheric mixture.

Earth's feed Settings menu offers All evidence, Science & space, and Politics &
security. The same filtered records drive the feed, globe markers and regional
dossiers. Solar atlas and acquisition remain independent. The lens uses source IDs,
connectors, topics and keywords; mixed articles can belong to both lenses and
unclassified records remain in All evidence. The selected lens is stored locally.

`src/content/orbitalSnapshot.json` contains 44 dated JPL Horizons geometric ICRF
vectors relative to the solar-system barycenter, in km and TDB. Relative vectors
are transformed into body-fixed axes using the secular IAU coefficients from
NAIF's pck00011.tpc. Periodic nutation and libration terms are omitted: this is
navigation context, not a precision observer ephemeris. There is no light-time
or aberration correction and no propagation between dates. Context spheres use
physical radii and distances but schematic colors, without rings or terrain;
point labels have exaggerated size for selection. They are shown only in 3D.

Use Nearby worlds to toggle background context, Look toward to find a direction,
and click a context body or its profile button to navigate. The foreground body
occludes background labels. The accessible profile list also provides center-to-
center distances. Unsupported positions or orientations are never invented.
Refresh the offline snapshot manually, with serial NASA API requests:

```bash
python3 deploy/refresh-orbital-snapshot.py --epoch 2026-11-23
```

Cached source responses live under ignored `release/orbital-source-cache`. To build
an app-only installer after the renderer and Electron builds:

```bash
python3 deploy/package-viewer-update.py --bundle-name world-update --installer install-world-update.sh
```

The installer backs up and atomically replaces app.asar. It does not change MERLIN,
provider credentials, observation archives or remote services. Rendering speed and
native interaction still require verification on the target GPU.
