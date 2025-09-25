import { useState, useEffect } from 'react';
import styled from 'styled-components';
import CustomInput from './ui/fields/CustomInput';

interface MapSelectorProps {
  onLocationSelect: (address: string, lat: number, lon: number) => void;
  initialAddress?: string;
  initialLat?: number;
  initialLon?: number;
}

const YandexMapSelector = ({ 
  onLocationSelect, 
  initialAddress = '', 
  initialLat = 55.751244, 
  initialLon = 37.618423 
}: MapSelectorProps) => {
  const [map, setMap] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState(initialAddress);
  const [selectedAddress, setSelectedAddress] = useState(initialAddress);
  const [suggestions, setSuggestions] = useState<any[]>([]);

  useEffect(() => {
    const loadMap = async () => {
      // @ts-ignore
      await ymaps.ready();
      
      // @ts-ignore
      const newMap = new ymaps.Map('map', {
        center: [initialLat, initialLon],
        zoom: 12,
        controls: ['zoomControl', 'fullscreenControl']
      });

      // @ts-ignore
      let placemark = new ymaps.Placemark([initialLat, initialLon], {}, {
        draggable: true
      });

      newMap.geoObjects.add(placemark);

      // Обработчик клика по карте
      newMap.events.add('click', (e: any) => {
        const coords = e.get('coords');
        updateLocation(coords, placemark, newMap);
      });

      // Обработчик перемещения метки
      placemark.events.add('dragend', () => {
        const coords = placemark.geometry.getCoordinates();
        updateLocation(coords, placemark, newMap);
      });

      setMap(newMap);
    };

    loadMap();
  }, []);

  const updateLocation = async (coords: number[], placemark: any, mapInstance: any) => {
    // @ts-ignore
    const response = await ymaps.geocode(coords);
    const firstGeoObject = response.geoObjects.get(0);
    const address = firstGeoObject.getAddressLine();
    
    placemark.geometry.setCoordinates(coords);
    mapInstance.panTo(coords, { flying: true });
    
    setSelectedAddress(address);
    setSearchQuery(address);
    onLocationSelect(address, coords[0], coords[1]);
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    // @ts-ignore
    const response = await ymaps.geocode(searchQuery);
    const firstGeoObject = response.geoObjects.get(0);
    
    if (firstGeoObject) {
      const coords = firstGeoObject.geometry.getCoordinates();
      const bounds = firstGeoObject.properties.get('boundedBy');
      
      if (map) {
        map.setBounds(bounds, { checkZoomRange: true });
        
        // @ts-ignore
        const placemark = new ymaps.Placemark(coords, {}, { draggable: true });
        map.geoObjects.removeAll();
        map.geoObjects.add(placemark);
        
        const address = firstGeoObject.getAddressLine();
        setSelectedAddress(address);
        onLocationSelect(address, coords[0], coords[1]);
      }
    }
  };

  return (
    <MapContainer>
      <SearchContainer>
        <CustomInput
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Введите адрес или название места"
          onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
        />
        <SearchButton onClick={handleSearch}>
          Найти
        </SearchButton>
      </SearchContainer>
      
      <MapInfo>
        Выбранный адрес: <strong>{selectedAddress || 'Не выбран'}</strong>
      </MapInfo>
      
      <MapElement id="map" />
      
      <Instructions>
        📍 Кликните на карте или найдите адрес через поиск
      </Instructions>
    </MapContainer>
  );
};

export default YandexMapSelector;

const MapContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const SearchContainer = styled.div`
  display: flex;
  gap: 8px;
`;

const SearchButton = styled.button`
  padding: 8px 16px;
  background-color: #007D88;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
`;

const MapElement = styled.div`
  width: 100%;
  height: 400px;
  border-radius: 8px;
  overflow: hidden;
`;

const MapInfo = styled.div`
  font-size: 14px;
  color: #374151;
`;

const Instructions = styled.div`
  font-size: 12px;
  color: #6b7280;
  text-align: center;
`;