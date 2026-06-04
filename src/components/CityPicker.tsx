import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MapPin, Search } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

// Principales villes du Cameroun avec leurs coordonnées
export const CAMEROON_CITIES = [
  { name: 'Yaoundé', region: 'Centre', lat: 3.8667, lng: 11.5167, population: '2.4M' },
  { name: 'Douala', region: 'Littoral', lat: 4.0511, lng: 9.7679, population: '2.7M' },
  { name: 'Garoua', region: 'Nord', lat: 9.3017, lng: 13.3967, population: '1.2M' },
  { name: 'Bafoussam', region: 'Ouest', lat: 5.4784, lng: 10.4177, population: '350K' },
  { name: 'Bamenda', region: 'Nord-Ouest', lat: 5.9631, lng: 10.1591, population: '500K' },
  { name: 'Maroua', region: 'Extrême-Nord', lat: 10.5908, lng: 14.3158, population: '320K' },
  { name: 'Ngaoundéré', region: 'Adamaoua', lat: 7.3167, lng: 13.5833, population: '280K' },
  { name: 'Bertoua', region: 'Est', lat: 4.5833, lng: 13.6833, population: '180K' },
  { name: 'Buéa', region: 'Sud-Ouest', lat: 4.1560, lng: 9.2348, population: '150K' },
  { name: 'Kumba', region: 'Sud-Ouest', lat: 4.6333, lng: 9.4500, population: '140K' },
  { name: 'Limbé', region: 'Sud-Ouest', lat: 4.0167, lng: 9.2000, population: '90K' },
  { name: 'Ebolowa', region: 'Sud', lat: 2.9000, lng: 11.1500, population: '80K' },
  { name: 'Kribi', region: 'Sud', lat: 2.9500, lng: 9.9167, population: '70K' },
  { name: 'Dschang', region: 'Ouest', lat: 5.4500, lng: 10.0500, population: '90K' },
  { name: 'Foumban', region: 'Ouest', lat: 5.7167, lng: 10.9000, population: '85K' },
  { name: 'Kousséri', region: 'Extrême-Nord', lat: 12.0767, lng: 15.0306, population: '90K' },
  { name: 'Edéa', region: 'Littoral', lat: 3.8000, lng: 10.1333, population: '120K' },
  { name: 'Sangmélima', region: 'Sud', lat: 2.9333, lng: 11.9833, population: '50K' },
  { name: 'Mbalmayo', region: 'Centre', lat: 3.5167, lng: 11.5000, population: '65K' },
  { name: 'Loum', region: 'Littoral', lat: 4.7167, lng: 9.7333, population: '60K' },
];

export interface CityCoords {
  lat: number;
  lng: number;
}

interface CityPickerProps {
  open: boolean;
  onClose: () => void;
  /** Appelé avec le nom de la ville et ses coordonnées (pour localisation précise) */
  onSelectCity: (cityName: string, coords?: CityCoords) => void;
  title?: string;
  selectedCity?: string;
}

export default function CityPicker({ open, onClose, onSelectCity, title = "Sélectionner une ville", selectedCity }: CityPickerProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRegion, setSelectedRegion] = useState<string>('all');

  const regions = ['all', ...Array.from(new Set(CAMEROON_CITIES.map(c => c.region)))];

  const filteredCities = CAMEROON_CITIES.filter(city => {
    const matchesSearch = city.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         city.region.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRegion = selectedRegion === 'all' || city.region === selectedRegion;
    return matchesSearch && matchesRegion;
  });

  const handleSelectCity = (cityName: string, coords?: CityCoords) => {
    const city = CAMEROON_CITIES.find(c => c.name === cityName);
    const coordsToPass = coords ?? (city ? { lat: city.lat, lng: city.lng } : undefined);
    onSelectCity(cityName, coordsToPass);
    onClose();
    setSearchTerm('');
  };

  // Calculer la distance approximative entre deux villes (formule de Haversine simplifiée)
  const calculateDistance = (city1Name: string, city2Name: string): number => {
    const city1 = CAMEROON_CITIES.find(c => c.name === city1Name);
    const city2 = CAMEROON_CITIES.find(c => c.name === city2Name);
    
    if (!city1 || !city2) return 0;

    const R = 6371; // Rayon de la Terre en km
    const dLat = (city2.lat - city1.lat) * Math.PI / 180;
    const dLng = (city2.lng - city1.lng) * Math.PI / 180;
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(city1.lat * Math.PI / 180) * Math.cos(city2.lat * Math.PI / 180) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            {title}
          </DialogTitle>
        </DialogHeader>

        {/* Barre de recherche et filtres */}
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher une ville..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Filtres par région */}
          <div className="flex flex-wrap gap-2">
            {regions.map(region => (
              <Badge
                key={region}
                variant={selectedRegion === region ? 'default' : 'outline'}
                className="cursor-pointer hover:bg-primary/20 transition-colors"
                onClick={() => setSelectedRegion(region)}
              >
                {region === 'all' ? '🌍 Toutes les régions' : region}
              </Badge>
            ))}
          </div>
        </div>

        {/* Carte simplifiée du Cameroun avec les villes */}
        <div className="flex-1 overflow-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 p-1">
            {filteredCities.map((city) => (
              <div
                key={city.name}
                onClick={() => handleSelectCity(city.name, { lat: city.lat, lng: city.lng })}
                className={`
                  relative p-4 rounded-lg border-2 cursor-pointer transition-all duration-200
                  hover:shadow-lg hover:scale-105 hover:border-primary
                  ${selectedCity === city.name ? 'border-primary bg-primary/10' : 'border-border bg-card'}
                `}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-bold text-lg">{city.name}</h3>
                    <p className="text-sm text-muted-foreground">{city.region}</p>
                  </div>
                  <MapPin className={`h-5 w-5 ${selectedCity === city.name ? 'text-primary' : 'text-muted-foreground'}`} />
                </div>
                
                <div className="flex items-center justify-between">
                  <Badge variant="secondary" className="text-xs">
                    👥 {city.population}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {city.lat.toFixed(2)}°, {city.lng.toFixed(2)}°
                  </span>
                </div>

                {selectedCity && selectedCity !== city.name && (
                  <div className="mt-2 pt-2 border-t border-border/50">
                    <p className="text-xs text-muted-foreground">
                      📍 Distance: ~{calculateDistance(selectedCity, city.name)} km
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>

          {filteredCities.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <MapPin className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Aucune ville trouvée</p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Annuler
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Fonction utilitaire exportée pour calculer les distances
export const getCityDistance = (city1: string, city2: string): number => {
  const cityData1 = CAMEROON_CITIES.find(c => c.name === city1);
  const cityData2 = CAMEROON_CITIES.find(c => c.name === city2);
  
  if (!cityData1 || !cityData2) return 0;

  const R = 6371;
  const dLat = (cityData2.lat - cityData1.lat) * Math.PI / 180;
  const dLng = (cityData2.lng - cityData1.lng) * Math.PI / 180;
  
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(cityData1.lat * Math.PI / 180) * Math.cos(cityData2.lat * Math.PI / 180) *
            Math.sin(dLng / 2) * Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
};

// Fonction pour obtenir les informations d'une ville
export const getCityInfo = (cityName: string) => {
  return CAMEROON_CITIES.find(c => c.name === cityName);
};



