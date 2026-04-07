import { useCallback, useEffect, useState } from "react";
import {
  USERS,
  DRIVERS,
  CABS,
  CAB_MAINTENANCE,
  BOOKINGS,
  RIDE_TRACKING,
  RATINGS_REVIEWS,
  PAYMENTS,
  EARNINGS,
} from "../data/mockData";

const API_BASE = "http://localhost:3000/api";

const FALLBACK_DATA = {
  users: USERS,
  drivers: DRIVERS,
  cabs: CABS,
  cab_maintenance: CAB_MAINTENANCE,
  bookings: BOOKINGS,
  ride_tracking: RIDE_TRACKING,
  ratings_reviews: RATINGS_REVIEWS,
  payments: PAYMENTS,
  earnings: EARNINGS,
};

export default function useBootstrapData() {
  const [data, setData] = useState(FALLBACK_DATA);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API_BASE}/bootstrap`);
      const liveData = await response.json();

      if (!response.ok) {
        throw new Error(liveData.message || "Request failed");
      }

      setData(liveData);
    } catch (err) {
      setError(`${err.message}. Showing mock data fallback.`);
      setData(FALLBACK_DATA);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { data, loading, error, reload: load };
}
