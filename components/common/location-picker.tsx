"use client";

import { useEffect, useRef, useState } from "react";
import type { Map as LeafletMap, Marker } from "leaflet";
import "leaflet/dist/leaflet.css";
import { IconCurrentLocation, IconLoader2, IconMapPin, IconSearch } from "@tabler/icons-react";

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

export function mapsLink(lat: number, lng: number) {
  return `https://www.google.com/maps/search/?api=1&query=${lat.toFixed(6)},${lng.toFixed(6)}`;
}

/**
 * Search a place (OpenStreetMap / Nominatim), then click the map or drag the pin to fine-tune.
 * No API key needed. Leaflet is loaded on the client only.
 */
export function LocationPicker({ value, onChange }: { value: { lat?: number; lng?: number }; onChange: (loc: PickedLocation) => void }) {
  const mapEl = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const markerRef = useRef<Marker | null>(null);
  const onChangeRef = useRef(onChange);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  const hasValue = typeof value.lat === "number" && typeof value.lng === "number";

  // Create the map once
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const L = (await import("leaflet")).default;
      if (cancelled || !mapEl.current || mapRef.current) return;
      const start: [number, number] = hasValue ? [value.lat!, value.lng!] : INDONESIA;
      const map = L.map(mapEl.current, { center: start, zoom: hasValue ? 16 : 5, scrollWheelZoom: false, attributionControl: true });
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(map);

      const icon = L.divIcon({
        className: "",
        html: '<div style="width:28px;height:28px;border-radius:50% 50% 50% 0;background:#1E1B17;transform:rotate(-45deg);border:3px solid #FFFDF9;box-shadow:0 4px 10px rgba(0,0,0,.3)"></div>',
        iconSize: [28, 28],
        iconAnchor: [14, 28],
      });
      const marker = L.marker(start, { draggable: true, icon, opacity: hasValue ? 1 : 0 }).addTo(map);
      const place = (lat: number, lng: number) => {
        marker.setLatLng([lat, lng]).setOpacity(1);
        onChangeRef.current({ lat, lng });
      };
      marker.on("dragend", () => {
        const p = marker.getLatLng();
        place(p.lat, p.lng);
      });
      map.on("click", (e) => place(e.latlng.lat, e.latlng.lng));

      mapRef.current = map;
      markerRef.current = marker;
    })();
    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- map is created once; later value changes are applied by flyTo below
  }, []);

  const flyTo = (lat: number, lng: number) => {
    markerRef.current?.setLatLng([lat, lng]).setOpacity(1);
    mapRef.current?.flyTo([lat, lng], 17, { duration: 0.8 });
  };

  const search = async () => {
    if (query.trim().length < 3) return;
    setSearching(true);
    setError("");
    try {
      const params = new URLSearchParams({ q: query, format: "json", limit: "5", countrycodes: "id", "accept-language": "id" });
      const res = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, { headers: { Accept: "application/json" } });
      const data: SearchResult[] = await res.json();
      setResults(data);
      if (!data.length) setError("Tempat tidak ditemukan. Coba nama gedung + kota, atau klik langsung di peta.");
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
    onChange({ lat, lng, address: r.display_name });
    setResults([]);
  };

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
                  <IconMapPin size={16} className="mt-0.5 shrink-0 text-[#8A6A2F]" />
                  <span className="line-clamp-2">{r.display_name}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="relative overflow-hidden rounded-xl border border-zinc-200">
        <div ref={mapEl} className="h-64 w-full bg-zinc-100" />
        <button
          type="button"
          onClick={locate}
          className="absolute bottom-3 right-3 z-[500] flex h-10 items-center gap-1.5 rounded-full border border-zinc-200 bg-white px-3.5 text-sm shadow-sm hover:bg-zinc-50"
        >
          {locating ? <IconLoader2 size={16} className="animate-spin" /> : <IconCurrentLocation size={16} />} Lokasi saya
        </button>
      </div>

      <p className="text-xs text-zinc-500">{error || (hasValue ? `Pin di ${value.lat!.toFixed(5)}, ${value.lng!.toFixed(5)}. Geser pin atau klik peta untuk memperbaiki.` : "Cari tempat lalu pilih hasilnya, atau klik peta untuk menaruh pin.")}</p>
    </div>
  );
}
