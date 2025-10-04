import { useState, useCallback } from 'react';
import type { District, Region } from '../types/region';
import regionService from '../services/regionService';

const useRegion = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [regionData, setRegionData] = useState<Region[] | null>(null);
  const [districtData, setDistrictData] = useState<District[] | null>(null);

  const getRegions = useCallback(async (): Promise<Region[] | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await regionService.getRegions();
      setRegionData(result);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getDisctricts = useCallback(async (id: number): Promise<District[] | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await regionService.getDistricts(id);
      setDistrictData(result);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    isLoading,
    error,
    regionData,
    districtData,
    getRegions,
    getDisctricts
  };
};

export default useRegion;