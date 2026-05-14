import { jsxs, jsx } from "react/jsx-runtime";
import { useState, useRef, useEffect, useMemo } from "react";
import { d as missionTypeLabel, p as detectedObjectLabel } from "./router-BHqUf-SS.js";
const tileProviders = {
  osm: {
    name: "OpenStreetMap",
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: "© OpenStreetMap",
    maxZoom: 19
  },
  satellite: {
    name: "Спутник",
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution: "© Esri",
    maxZoom: 19
  },
  topo: {
    name: "Топография",
    url: "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
    attribution: "© OpenTopoMap",
    maxZoom: 17
  },
  dark: {
    name: "Тёмная",
    url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
    attribution: "© CARTO",
    maxZoom: 19
  }
};
const mapProviderList = Object.entries(tileProviders).map(([id, v]) => ({
  id,
  name: v.name
}));
function droneIcon(L, name, heading, color = "#06b6d4", isActive = false) {
  const size = isActive ? 36 : 30;
  const svg = `
    <div style="position:relative;width:${size}px;height:${size}px;">
      ${isActive ? `<div style="position:absolute;inset:-12px;border-radius:50%;background:${color}33;animation:droneRing 2s ease-out infinite;"></div>` : ""}
      <div style="position:absolute;inset:0;transform:rotate(${heading}deg);">
        <svg viewBox="0 0 24 24" width="${size}" height="${size}" style="filter:drop-shadow(0 0 6px ${color}aa);">
          <path d="M12 2 L16 9 L20 8 L19 12 L20 16 L16 15 L12 22 L8 15 L4 16 L5 12 L4 8 L8 9 Z"
                fill="${color}" stroke="#0b1220" stroke-width="1"/>
          <circle cx="12" cy="12" r="3" fill="#0b1220" stroke="${color}" stroke-width="1.5"/>
        </svg>
      </div>
      <div style="position:absolute;top:${size + 2}px;left:50%;transform:translateX(-50%);font:600 10px/1 'JetBrains Mono',monospace;color:${color};text-shadow:0 0 4px #000,0 0 4px #000,0 0 4px #000;white-space:nowrap;">${name}</div>
    </div>`;
  return L.divIcon({ html: svg, className: "drone-marker", iconSize: [size, size], iconAnchor: [size / 2, size / 2] });
}
const objectColors = {
  person: "#fbbf24",
  vehicle: "#60a5fa",
  fire: "#ef4444",
  animal: "#a78bfa",
  anomaly: "#f97316"
};
function objectIcon(L, type) {
  const color = objectColors[type] ?? "#94a3b8";
  const svg = `
    <div style="width:22px;height:22px;border-radius:50%;background:${color};border:2px solid #0b1220;box-shadow:0 0 8px ${color}aa;display:flex;align-items:center;justify-content:center;color:#0b1220;font:700 10px 'JetBrains Mono',monospace;">!</div>`;
  return L.divIcon({ html: svg, className: "object-marker", iconSize: [22, 22], iconAnchor: [11, 11] });
}
function waypointIcon(L, index, isLast = false) {
  const color = isLast ? "#22c55e" : "#06b6d4";
  const svg = `
    <div style="width:20px;height:20px;border-radius:50%;background:${color}cc;border:2px solid #0b1220;display:flex;align-items:center;justify-content:center;color:#0b1220;font:700 10px 'JetBrains Mono',monospace;">${index}</div>`;
  return L.divIcon({ html: svg, className: "wp-marker", iconSize: [20, 20], iconAnchor: [10, 10] });
}
function DroneMap({
  drones = [],
  activeDroneId,
  missions = [],
  activeMissionId,
  detections = [],
  geoZones = [],
  center = [55.7558, 37.6173],
  zoom = 14,
  provider = "dark",
  onMapClick,
  height = "100%",
  showProviderSwitcher = true,
  onProviderChange,
  gatewayPosition,
  showMeshLink = false,
  showFleetMesh = false
}) {
  const [leaflet, setLeaflet] = useState(null);
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const tileLayerRef = useRef(null);
  const layerGroupRef = useRef(null);
  const routeStateRef = useRef({
    mode: "direct",
    hopId: null
  });
  const [routeBadge, setRouteBadge] = useState(null);
  useEffect(() => {
    if (typeof window === "undefined") return;
    let cancelled = false;
    if (!document.getElementById("leaflet-css")) {
      const link = document.createElement("link");
      link.id = "leaflet-css";
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }
    import("leaflet").then((mod) => {
      if (!cancelled) setLeaflet(mod.default ?? mod);
    });
    return () => {
      cancelled = true;
    };
  }, []);
  useEffect(() => {
    if (!leaflet || !containerRef.current || mapRef.current) return;
    const map = leaflet.map(containerRef.current, {
      center,
      zoom,
      zoomControl: true,
      attributionControl: true
    });
    mapRef.current = map;
    const tp = tileProviders[provider];
    const layer = leaflet.tileLayer(tp.url, { attribution: tp.attribution, maxZoom: tp.maxZoom }).addTo(map);
    tileLayerRef.current = layer;
    layerGroupRef.current = leaflet.layerGroup().addTo(map);
    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [leaflet]);
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !leaflet) return;
    const handler = (e) => {
      onMapClick?.(e.latlng.lat, e.latlng.lng);
    };
    if (onMapClick) map.on("click", handler);
    return () => {
      map.off("click", handler);
    };
  }, [leaflet, onMapClick]);
  useEffect(() => {
    const map = mapRef.current;
    if (!leaflet || !map || !tileLayerRef.current) return;
    map.removeLayer(tileLayerRef.current);
    const tp = tileProviders[provider];
    const layer = leaflet.tileLayer(tp.url, { attribution: tp.attribution, maxZoom: tp.maxZoom }).addTo(map);
    tileLayerRef.current = layer;
  }, [leaflet, provider]);
  const layersData = useMemo(
    () => ({
      drones,
      missions,
      detections,
      geoZones,
      activeDroneId,
      activeMissionId,
      gatewayPosition,
      showMeshLink,
      showFleetMesh
    }),
    [drones, missions, detections, geoZones, activeDroneId, activeMissionId, gatewayPosition, showMeshLink, showFleetMesh]
  );
  useEffect(() => {
    if (!leaflet) return;
    const grp = layerGroupRef.current;
    const L = leaflet;
    if (!grp) return;
    grp.clearLayers();
    layersData.geoZones.forEach((z) => {
      const colors = {
        allowed: { stroke: "#22c55e", fill: "#22c55e" },
        restricted: { stroke: "#ef4444", fill: "#ef4444" },
        warning: { stroke: "#fbbf24", fill: "#fbbf24" }
      };
      const c = colors[z.type];
      const polygon = L.polygon(z.polygon, {
        color: c.stroke,
        weight: 2,
        opacity: 0.7,
        fillColor: c.fill,
        fillOpacity: 0.08,
        dashArray: z.type === "restricted" ? "6 6" : void 0
      });
      polygon.bindTooltip(z.name, { sticky: true, className: "leaflet-tooltip-coba" });
      grp.addLayer(polygon);
    });
    if (layersData.showMeshLink && layersData.gatewayPosition && layersData.activeDroneId) {
      const active = layersData.drones.find((d) => d.id === layersData.activeDroneId);
      if (active && active.status !== "offline" && active.status !== "maintenance") {
        const gw = layersData.gatewayPosition;
        const prev = routeStateRef.current;
        let mode = prev.mode;
        if (active.signal < 60) mode = "hop";
        else if (active.signal >= 70) mode = "direct";
        const peerCandidates = layersData.drones.filter(
          (d) => d.id !== active.id && (d.status === "mission" || d.status === "online") && d.signal >= 70
        );
        let hop = null;
        if (mode === "hop" && peerCandidates.length) {
          const sticky = prev.hopId ? peerCandidates.find((p) => p.id === prev.hopId) : void 0;
          hop = sticky ?? peerCandidates.map((p) => ({
            p,
            dist: Math.hypot(
              p.position[0] - active.position[0],
              p.position[1] - active.position[1]
            )
          })).sort((a, b) => a.dist - b.dist)[0].p;
        }
        if (mode === "hop" && !hop) {
          mode = "direct";
        }
        const newHopId = hop?.id ?? null;
        if (prev.mode !== mode || prev.hopId !== newHopId) {
          routeStateRef.current = { mode, hopId: newHopId };
        }
        setRouteBadge((curr) => {
          const next = {
            mode,
            hopName: hop?.name,
            signal: active.signal
          };
          if (curr && curr.mode === next.mode && curr.hopName === next.hopName && curr.signal === next.signal) {
            return curr;
          }
          return next;
        });
        const fadeClass = prev.mode !== mode || prev.hopId !== newHopId ? " mesh-link-fade" : "";
        const segments = mode === "hop" && hop ? [
          [gw, hop.position],
          [hop.position, active.position]
        ] : [[gw, active.position]];
        segments.forEach(([from, to]) => {
          grp.addLayer(
            L.polyline([from, to], {
              color: "#06b6d4",
              weight: 8,
              opacity: 0.18,
              lineCap: "round",
              className: `mesh-link-glow${fadeClass}`
            })
          );
        });
        segments.forEach(([from, to]) => {
          grp.addLayer(
            L.polyline([from, to], {
              color: "#22d3ee",
              weight: 2.5,
              opacity: 0.9,
              dashArray: "6 6",
              className: `mesh-link-flow${fadeClass}`
            })
          );
        });
        const gwIcon = L.divIcon({
          className: "gateway-marker",
          html: `<div style="position:relative;width:34px;height:34px;">
              <div style="position:absolute;inset:-8px;border-radius:50%;background:#06b6d433;animation:droneRing 2.4s ease-out infinite;"></div>
              <div style="position:absolute;inset:0;border-radius:50%;background:#0b1220;border:2px solid #06b6d4;display:flex;align-items:center;justify-content:center;color:#06b6d4;font:700 10px 'JetBrains Mono',monospace;box-shadow:0 0 12px #06b6d4aa;">ОП</div>
            </div>`,
          iconSize: [34, 34],
          iconAnchor: [17, 17]
        });
        const gwMarker = L.marker(gw, { icon: gwIcon, zIndexOffset: 800 });
        gwMarker.bindTooltip("Наземный шлюз · Оператор", {
          direction: "top",
          offset: [0, -16],
          className: "leaflet-tooltip-coba"
        });
        grp.addLayer(gwMarker);
        if (mode === "hop" && hop) {
          const hopMarker = L.circleMarker(hop.position, {
            radius: 10,
            color: "#a855f7",
            weight: 2,
            fillColor: "#a855f7",
            fillOpacity: 0.25
          });
          hopMarker.bindTooltip(`Транзит: ${hop.name} (${hop.signal}%)`, {
            direction: "top",
            className: "leaflet-tooltip-coba"
          });
          grp.addLayer(hopMarker);
        }
      } else {
        setRouteBadge(null);
      }
    } else {
      setRouteBadge((curr) => curr === null ? curr : null);
    }
    if (layersData.showFleetMesh) {
      const peers = layersData.drones.filter(
        (d) => d.status === "mission" || d.status === "online"
      );
      const MAX_KM = 3;
      for (let i = 0; i < peers.length; i++) {
        for (let j = i + 1; j < peers.length; j++) {
          const a = peers[i];
          const b = peers[j];
          const dLat = (b.position[0] - a.position[0]) * 111;
          const dLng = (b.position[1] - a.position[1]) * 111 * Math.cos(a.position[0] * Math.PI / 180);
          const km = Math.hypot(dLat, dLng);
          if (km > MAX_KM) continue;
          const strength = Math.max(0, 1 - km / MAX_KM);
          const color = strength > 0.66 ? "#22c55e" : strength > 0.33 ? "#fbbf24" : "#ef4444";
          grp.addLayer(
            L.polyline([a.position, b.position], {
              color,
              weight: 1.4,
              opacity: 0.35 + strength * 0.4,
              dashArray: strength > 0.5 ? void 0 : "4 4"
            })
          );
        }
      }
    }
    layersData.missions.forEach((m) => {
      if (m.waypoints.length < 1) return;
      const isActive = m.id === layersData.activeMissionId;
      const path = m.waypoints.map((w) => [w.lat, w.lng]);
      if (path.length > 1) {
        const polyline = L.polyline(path, {
          color: m.status === "running" ? "#06b6d4" : isActive ? "#fbbf24" : "#64748b",
          weight: isActive ? 3 : 2,
          opacity: isActive ? 0.95 : 0.5,
          dashArray: m.status === "completed" ? void 0 : "8 6"
        });
        polyline.bindTooltip(`${m.id} · ${m.name}`, { sticky: true, className: "leaflet-tooltip-coba" });
        grp.addLayer(polyline);
      }
      if (isActive) {
        m.waypoints.forEach((w, i) => {
          const marker = L.marker([w.lat, w.lng], {
            icon: waypointIcon(L, i + 1, i === m.waypoints.length - 1)
          });
          marker.bindPopup(
            `<div style="font:600 12px Inter,sans-serif;color:#06b6d4;margin-bottom:4px;">Точка ${i + 1}</div>
             <div style="font:11px 'JetBrains Mono',monospace;color:#94a3b8;line-height:1.5;">
               <div>LAT: ${w.lat.toFixed(5)}</div>
               <div>LNG: ${w.lng.toFixed(5)}</div>
               <div>ALT: ${w.altitude} м</div>
               <div>SPD: ${w.speed} м/с</div>
               ${w.action ? `<div style="color:#fbbf24;margin-top:4px;">Действие: ${w.action}</div>` : ""}
             </div>`,
            { className: "leaflet-popup-coba" }
          );
          grp.addLayer(marker);
        });
      }
    });
    layersData.drones.forEach((d) => {
      if (d.status === "maintenance" || d.status === "offline") return;
      const isActive = d.id === layersData.activeDroneId;
      const color = d.status === "mission" ? "#06b6d4" : d.status === "charging" ? "#fbbf24" : "#22c55e";
      const marker = L.marker(d.position, {
        icon: droneIcon(L, d.name, d.heading, color, isActive),
        zIndexOffset: isActive ? 1e3 : 100
      });
      const missionInfo = d.mission ? layersData.missions.find((m) => m.id === d.mission) : null;
      marker.bindPopup(
        `<div style="font:700 13px Inter,sans-serif;color:${color};margin-bottom:6px;">${d.name}</div>
         <div style="font:11px 'JetBrains Mono',monospace;color:#94a3b8;line-height:1.6;">
           <div>ID: <span style="color:#e2e8f0;">${d.id}</span></div>
           <div>Режим: <span style="color:#e2e8f0;">${d.mode}</span></div>
           <div>Батарея: <span style="color:#e2e8f0;">${d.battery}%</span></div>
           <div>Сигнал: <span style="color:#e2e8f0;">${d.signal}%</span></div>
           ${missionInfo ? `<div style="margin-top:6px;padding-top:6px;border-top:1px solid #334155;">Миссия: <span style="color:#06b6d4;">${missionInfo.name}</span></div>
              <div>Тип: ${missionTypeLabel[missionInfo.type]}</div>` : ""}
         </div>`,
        { className: "leaflet-popup-coba" }
      );
      grp.addLayer(marker);
    });
    layersData.detections.forEach((o) => {
      const marker = L.marker(o.position, { icon: objectIcon(L, o.type) });
      marker.bindPopup(
        `<div style="font:700 12px Inter,sans-serif;color:${objectColors[o.type] ?? "#94a3b8"};margin-bottom:6px;">
           ${detectedObjectLabel[o.type] ?? o.type}
         </div>
         <div style="font:11px 'JetBrains Mono',monospace;color:#94a3b8;line-height:1.6;">
           <div>Время: <span style="color:#e2e8f0;">${o.detectedAt}</span></div>
           <div>Дрон: <span style="color:#e2e8f0;">${o.detectedBy}</span></div>
           <div>Достов.: <span style="color:#e2e8f0;">${o.confidence}%</span></div>
           <div>Коорд.: <span style="color:#e2e8f0;">${o.position[0].toFixed(4)}, ${o.position[1].toFixed(4)}</span></div>
           <div style="margin-top:6px;color:#cbd5e1;">${o.description}</div>
         </div>`,
        { className: "leaflet-popup-coba" }
      );
      grp.addLayer(marker);
    });
  }, [leaflet, layersData]);
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    map.setView(center, zoom);
  }, [center[0], center[1]]);
  return /* @__PURE__ */ jsxs("div", { className: "relative h-full w-full", style: { height }, children: [
    /* @__PURE__ */ jsx("div", { ref: containerRef, className: "h-full w-full", style: { height } }),
    showMeshLink && routeBadge && /* @__PURE__ */ jsxs(
      "div",
      {
        className: "mesh-route-badge mesh-link-fade absolute left-3 top-3 z-[400] flex items-center gap-2 rounded-md border border-primary/40 bg-background/85 px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-wider text-primary backdrop-blur",
        children: [
          /* @__PURE__ */ jsx(
            "span",
            {
              className: `h-2 w-2 rounded-full ${routeBadge.mode === "direct" ? "bg-success" : "bg-accent"}`
            }
          ),
          /* @__PURE__ */ jsx("span", { className: "text-foreground", children: routeBadge.mode === "direct" ? "DIRECT" : `MULTI-HOP · ${routeBadge.hopName ?? ""}` }),
          /* @__PURE__ */ jsxs("span", { className: "text-muted-foreground", children: [
            "SIG ",
            routeBadge.signal,
            "%"
          ] })
        ]
      },
      `${routeBadge.mode}-${routeBadge.hopName ?? "none"}`
    ),
    showProviderSwitcher && /* @__PURE__ */ jsx("div", { className: "absolute right-3 top-3 z-[400] flex flex-col gap-1 rounded-md border border-border bg-background/85 p-1 backdrop-blur", children: mapProviderList.map((p) => /* @__PURE__ */ jsx(
      "button",
      {
        onClick: () => onProviderChange?.(p.id),
        className: [
          "rounded px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider transition-colors",
          provider === p.id ? "bg-primary/20 text-primary" : "text-muted-foreground hover:bg-secondary hover:text-foreground"
        ].join(" "),
        children: p.name
      },
      p.id
    )) })
  ] });
}
export {
  DroneMap as D
};
