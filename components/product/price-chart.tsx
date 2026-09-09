"use client";

import { useEffect, useState } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer,
} from "recharts";
import { formatPrice } from "@/lib/utils";

interface PriceChartProps {
  productId: string;
}

export function PriceChart({ productId }: PriceChartProps) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await fetch(`/api/products/${productId}/history?dias=${days}`);
        const json = await res.json();
        setData(json.history ?? []);
      } catch {
        setData([]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [productId, days]);

  if (loading) {
    return <div className="skeleton h-48 rounded-lg" />;
  }

  if (data.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center text-gray-400 text-sm">
        No hay datos de historial disponibles aún
      </div>
    );
  }

  // Obtener tiendas únicas para generar líneas del gráfico
  const stores = [...new Set(data.map((d) => d.store))];
  const COLORS = ["#2563eb", "#16a34a", "#9333ea", "#dc2626", "#ea580c"];

  // Formatear datos para Recharts (agrupar por fecha)
  const chartData: Record<string, any>[] = [];
  const dateMap: Record<string, Record<string, number>> = {};

  data.forEach((d) => {
    if (!dateMap[d.date]) dateMap[d.date] = {};
    dateMap[d.date][d.store] = d.price;
  });

  Object.entries(dateMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .forEach(([date, prices]) => {
      chartData.push({ date: date.substring(5), ...prices });
    });

  return (
    <div>
      {/* Selector de período */}
      <div className="flex gap-2 mb-4 justify-end">
        {[7, 30, 90].map((d) => (
          <button
            key={d}
            onClick={() => setDays(d)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              days === d
                ? "bg-brand-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {d} días
          </button>
        ))}
      </div>

      <ResponsiveContainer width="100%" height={240}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="date" tick={{ fontSize: 11 }} />
          <YAxis
            tickFormatter={(v) => `${v}€`}
            tick={{ fontSize: 11 }}
            domain={["auto", "auto"]}
          />
          <Tooltip
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            formatter={(value: any, name: any) => [formatPrice(value as number), String(name)]}
          />
          <Legend />
          {stores.map((store, i) => (
            <Line
              key={store}
              type="monotone"
              dataKey={store}
              stroke={COLORS[i % COLORS.length]}
              strokeWidth={2}
              dot={false}
              connectNulls
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
