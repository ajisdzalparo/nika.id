"use client";

import { useEffect, useRef, useState } from "react";
import type { Map as LeafletMap, Marker } from "leaflet";
import "leaflet/dist/leaflet.css";
import { IconBrandGoogle, IconCurrentLocation, IconExternalLink, IconLoader2, IconMapPin, IconSearch } from "@tabler/icons-react";

export interface PickedLocation {
  lat: number;
  lng: number;
  /** Full address from search, when the location came from a search result */
  address?: string;
}

interface SearchResult {
  display_name: string;
  lat: string;
  lon: string;
}

const INDONESIA: [number, number] = [-2.5, 118];

interface PhotonFeature {
  geometry: { coordinates: [number, number] };
  properties: Record<string, string | undefined>;
}

async function searchPhoton(q: string): Promise<SearchResult[]> {
  // bbox keeps results inside Indonesia; lang=default keeps local names (Jawa Barat, not West Java)
  const params = new URLSearchParams({ q, limit: "6", bbox: "94.7,-11.2,141.1,6.3", lang: "default" });
  const res = await fetch(`https://photon.komoot.io/api/?${params}`);
  if (!res.ok) return [];
  const { features = [] } = (await res.json()) as { features?: PhotonFeature[] };
  const seen = new Set<string>();
  return features.flatMap(({ geometry, properties: p }) => {
    const [lon, lat] = geometry.coordinates;
    const parts = [p.name, p.street && p.housenumber ? `${p.street} ${p.housenumber}` : p.street, p.district, p.city ?? p.county, p.state];
    const display_name = [...new Set(parts.filter(Boolean))].join(", ");
    if (!display_name || seen.has(display_name)) return [];
    seen.add(display_name);
    return [{ display_name, lat: String(lat), lon: String(lon) }];
  });
}

async function searchNominatim(q: string): Promise<SearchResult[]> {
  const params = new URLSearchParams({ q, format: "json", limit: "5", countrycodes: "id", "accept-language": "id" });
  const res = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, { headers: { Accept: "application/json" } });
  return res.ok ? res.json() : [];
}

export function mapsLink(lat: number, lng: number) {
  return `https://www.google.com/maps/search/?api=1&query=${lat.toFixed(6)},${lng.toFixed(6)}`;
}

/**
 * Search a place (OpenStreetMap / Nominatim), then click the map or drag the pin to fine-tune.
 * No API key needed. Leaflet is loaded on the client only.
 */
export function LocationPicker({
  value,
  onChange,
  initialQuery = "",
}: {
  value: { lat?: number; lng?: number };
  onChange: (loc: PickedLocation) => void;
  initialQuery?: string;
}) {
  const mapEl = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const markerRef = useRef<Marker | null>(null);
  const onChangeRef = useRef(onChange);
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [locating, setLocating] = useState(false);
  const [viewMode, setViewMode] = useState<"gmaps" | "pin">("gmaps");
  const [error, setError] = useState("");

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  const hasValue =
    typeof value.lat === "number" &&
    Number.isFinite(value.lat) &&
    typeof value.lng === "number" &&
    Number.isFinite(value.lng);
  const latestPinRef = useRef<{ lat?: number; lng?: number }>({ lat: value.lat, lng: value.lng });
  useEffect(() => {
    latestPinRef.current = { lat: value.lat, lng: value.lng };
  }, [value.lat, value.lng]);

  // Initialize Leaflet only when the pin map container is actually mounted and visible (non-zero size)
  useEffect(() => {
    if (viewMode !== "pin") return;
    let cancelled = false;
    let resizeObserver: ResizeObserver | null = null;
    (async () => {
      const L = (await import("leaflet")).default;
      if (cancelled || !mapEl.current || mapRef.current) return;
      const cur = latestPinRef.current;
      const startHasPin =
        typeof cur.lat === "number" &&
        Number.isFinite(cur.lat) &&
        typeof cur.lng === "number" &&
        Number.isFinite(cur.lng);
      const start: [number, number] = startHasPin ? [cur.lat!, cur.lng!] : INDONESIA;
      const map = L.map(mapEl.current, { center: start, zoom: startHasPin ? 16 : 5, scrollWheelZoom: false, attributionControl: true });
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(map);

      const icon = L.divIcon({
        className: "",
        html: '<div style="width:28px;height:28px;border-radius:50% 50% 50% 0;background:#1F1A14;transform:rotate(-45deg);border:3px solid #FFFDF9;box-shadow:0 4px 10px rgba(0,0,0,.3)"></div>',
        iconSize: [28, 28],
        iconAnchor: [14, 28],
      });
      const marker = L.marker(start, { draggable: true, icon, opacity: startHasPin ? 1 : 0 }).addTo(map);
      const place = (lat: number, lng: number) => {
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
        marker.setLatLng([lat, lng]).setOpacity(1);
        setError("");
        onChangeRef.current({ lat, lng });
      };
      marker.on("dragend", () => {
        const p = marker.getLatLng();
        place(p.lat, p.lng);
      });
      map.on("click", (e) => place(e.latlng.lat, e.latlng.lng));

      mapRef.current = map;
      markerRef.current = marker;

      // The editor keeps hidden tabs mounted: a map created at 0×0 renders grey tiles and maps clicks to
      // the wrong spot until Leaflet re-measures. Re-measure whenever the container's size changes.
      resizeObserver = new ResizeObserver(() => {
        const el = mapEl.current;
        if (!el || el.clientWidth === 0 || el.clientHeight === 0) return;
        map.invalidateSize({ pan: false });
        const cur = marker.getLatLng();
        if (marker.options.opacity) map.setView(cur, map.getZoom(), { animate: false });
      });
      resizeObserver.observe(mapEl.current);
    })();
    return () => {
      cancelled = true;
      resizeObserver?.disconnect();
      mapRef.current?.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
  }, [viewMode]);

  const flyTo = (lat: number, lng: number) => {
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
    const map = mapRef.current;
    const size = map?.getSize();
    if (!map || !size || size.x <= 0 || size.y <= 0) return;
    markerRef.current?.setLatLng([lat, lng]).setOpacity(1);
    map.setView([lat, lng], 17, { animate: true });
  };

  const search = async () => {
    if (query.trim().length < 3) return;
    setSearching(true);
    setError("");
    try {
      // Photon knows many Indonesian villages (desa/kelurahan) that Nominatim misses; Nominatim is the fallback.
      let data = await searchPhoton(query).catch(() => [] as SearchResult[]);
      if (!data.length) data = await searchNominatim(query).catch(() => [] as SearchResult[]);
      setResults(data);
      if (!data.length) setError("Tempat tidak ditemukan. Coba nama desa/gedung + kota, atau klik langsung di peta.");
    } catch {
      setError("Pencarian gagal. Klik langsung di peta untuk menaruh pin.");
    } finally {
      setSearching(false);
    }
  };

  const pick = (r: SearchResult) => {
    const lat = Number(r.lat);
    const lng = Number(r.lon);
    flyTo(lat, lng);
    setQuery(r.display_name);
    onChange({ lat, lng, address: r.display_name });
    setResults([]);
  };

  const gmapsQuery = hasValue
    ? `${value.lat!.toFixed(6)},${value.lng!.toFixed(6)}`
    : query.trim() || "Jakarta, Indonesia";
  const gmapsEmbedSrc = `https://maps.google.com/maps?q=${encodeURIComponent(gmapsQuery)}&z=${hasValue ? 16 : query.trim() ? 15 : 5}&output=embed`;
  const gmapsDirectUrl = hasValue
    ? mapsLink(value.lat!, value.lng!)
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(gmapsQuery)}`;

  const locate = () => {
    if (!navigator.geolocation) return setError("Browser tidak mendukung lokasi.");
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        flyTo(pos.coords.latitude, pos.coords.longitude);
        onChange({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      },
      () => {
        setLocating(false);
        setError("Izin lokasi ditolak.");
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  return (
    <div className="space-y-2">
      <div className="relative flex gap-2">
        <label className="flex h-11 flex-1 items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3.5">
          <IconSearch size={16} className="shrink-0 text-zinc-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                search();
              }
            }}
            placeholder="Cari tempat, mis. Masjid Agung Bandung"
            className="w-full bg-transparent text-[15px] outline-none"
          />
        </label>
        <button type="button" onClick={() => search()} disabled={searching} className="flex h-11 shrink-0 items-center gap-1.5 rounded-full bg-zinc-900 px-4 text-sm font-medium text-zinc-50 disabled:opacity-50">
          {searching ? <IconLoader2 size={16} className="animate-spin" /> : <IconSearch size={16} />} Cari
        </button>
        {results.length > 0 && (
          <ul className="absolute inset-x-0 top-12 z-[1100] overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-lg">
            {results.map((r) => (
              <li key={`${r.lat},${r.lon}`}>
                <button type="button" onClick={() => pick(r)} className="flex w-full gap-2 px-3.5 py-3 text-left text-sm hover:bg-zinc-100">
                  <IconMapPin size={16} className="mt-0.5 shrink-0 text-[#8A6424]" />
                  <span className="line-clamp-2">{r.display_name}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="inline-flex rounded-full border border-zinc-200 bg-zinc-50 p-0.5 text-xs">
          <button
            type="button"
            onClick={() => setViewMode("gmaps")}
            className={`inline-flex h-9 items-center gap-1 rounded-full px-3 font-medium transition ${
              viewMode === "gmaps" ? "bg-zinc-900 text-white" : "text-zinc-600 hover:text-zinc-900"
            }`}
          >
            <IconBrandGoogle size={13} /> Tampilan Google Maps
          </button>
          <button
            type="button"
            onClick={() => {
              setViewMode("pin");
              setTimeout(() => mapRef.current?.invalidateSize(), 60);
            }}
            className={`inline-flex h-9 items-center gap-1 rounded-full px-3 font-medium transition ${
              viewMode === "pin" ? "bg-zinc-900 text-white" : "text-zinc-600 hover:text-zinc-900"
            }`}
          >
            <IconMapPin size={13} /> Geser Pin Peta
          </button>
        </div>
        <a
          href={gmapsDirectUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex min-h-9 items-center gap-1 text-xs font-medium text-[#8A6424] hover:underline"
        >
          Buka di Google Maps <IconExternalLink size={12} />
        </a>
      </div>

      {/* isolate: Leaflet panes use z-index 400-1000; keep them below popovers (date picker, selects) */}
      <div className="relative isolate overflow-hidden rounded-xl border border-zinc-200">
        {viewMode === "gmaps" ? (
          <iframe
            title="Pratinjau Google Maps"
            src={gmapsEmbedSrc}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            className="h-64 w-full border-0 bg-zinc-100"
          />
        ) : (
          <div ref={mapEl} className="h-64 w-full bg-zinc-100" />
        )}
        <button
          type="button"
          onClick={locate}
          className="absolute bottom-3 right-3 z-[500] flex h-10 items-center gap-1.5 rounded-full border border-zinc-200 bg-white px-3.5 text-sm shadow-sm hover:bg-zinc-50"
        >
          {locating ? <IconLoader2 size={16} className="animate-spin" /> : <IconCurrentLocation size={16} />} Lokasi saya
        </button>
      </div>

      <p className="text-xs text-zinc-500">
        {error ||
          (hasValue
            ? `Pin tersimpan di ${value.lat!.toFixed(5)}, ${value.lng!.toFixed(5)}. Link Google Maps otomatis dibuat.`
            : "Cari nama gedung/tempat lalu pilih dari daftar, atau beralih ke Geser Pin Peta untuk menaruh pin manual.")}
      </p>
    </div>
  );
}
