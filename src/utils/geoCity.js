/**
 * Real-time Reverse Geocoder for Metro Manila LGUs & Singapore
 * Formatted as "Municipality/District, City/Region"
 */

export const CITY_DATABASE = [
  {
    name: 'Quezon City, Metro Manila',
    district: 'Diliman',
    city: 'Quezon City',
    state: 'Metro Manila',
    displayLocation: 'Diliman, Quezon City',
    center: [121.0503, 14.6507],
    leavesCanopy: '15.4%',
    canopyNum: 15.4
  },
  {
    name: 'Taguig, Metro Manila',
    district: 'BGC & Fort Bonifacio',
    city: 'Taguig',
    state: 'Metro Manila',
    displayLocation: 'BGC, Taguig',
    center: [121.0509, 14.5378],
    leavesCanopy: '6.8%',
    canopyNum: 6.8
  },
  {
    name: 'City of Manila, Metro Manila',
    district: 'Intramuros & Ermita',
    city: 'City of Manila',
    state: 'Metro Manila',
    displayLocation: 'Intramuros, City of Manila',
    center: [120.9842, 14.5995],
    leavesCanopy: '3.2%',
    canopyNum: 3.2
  },
  {
    name: 'Makati, Metro Manila',
    district: 'Central Business District',
    city: 'Makati',
    state: 'Metro Manila',
    displayLocation: 'CBD, Makati',
    center: [121.0244, 14.5547],
    leavesCanopy: '7.1%',
    canopyNum: 7.1
  },
  {
    name: 'Pasig, Metro Manila',
    district: 'Ortigas Center',
    city: 'Pasig',
    state: 'Metro Manila',
    displayLocation: 'Ortigas, Pasig',
    center: [121.0800, 14.5764],
    leavesCanopy: '5.9%',
    canopyNum: 5.9
  },
  {
    name: 'Mandaluyong, Metro Manila',
    district: 'Highway Hills',
    city: 'Mandaluyong',
    state: 'Metro Manila',
    displayLocation: 'Highway Hills, Mandaluyong',
    center: [121.0336, 14.5794],
    leavesCanopy: '4.3%',
    canopyNum: 4.3
  },
  {
    name: 'San Juan, Metro Manila',
    district: 'Greenhills',
    city: 'San Juan',
    state: 'Metro Manila',
    displayLocation: 'Greenhills, San Juan',
    center: [121.0336, 14.6019],
    leavesCanopy: '4.1%',
    canopyNum: 4.1
  },
  {
    name: 'Pasay, Metro Manila',
    district: 'Bay City',
    city: 'Pasay',
    state: 'Metro Manila',
    displayLocation: 'Bay City, Pasay',
    center: [120.9990, 14.5378],
    leavesCanopy: '4.0%',
    canopyNum: 4.0
  },
  {
    name: 'Parañaque, Metro Manila',
    district: 'Baclaran & BF Homes',
    city: 'Parañaque',
    state: 'Metro Manila',
    displayLocation: 'BF Homes, Parañaque',
    center: [121.0167, 14.4793],
    leavesCanopy: '5.2%',
    canopyNum: 5.2
  },
  {
    name: 'Las Piñas, Metro Manila',
    district: 'Pamplona',
    city: 'Las Piñas',
    state: 'Metro Manila',
    displayLocation: 'Pamplona, Las Piñas',
    center: [120.9928, 14.4445],
    leavesCanopy: '7.8%',
    canopyNum: 7.8
  },
  {
    name: 'Muntinlupa, Metro Manila',
    district: 'Alabang',
    city: 'Muntinlupa',
    state: 'Metro Manila',
    displayLocation: 'Alabang, Muntinlupa',
    center: [121.0439, 14.4081],
    leavesCanopy: '12.1%',
    canopyNum: 12.1
  },
  {
    name: 'Caloocan, Metro Manila',
    district: 'Grace Park',
    city: 'Caloocan',
    state: 'Metro Manila',
    displayLocation: 'Grace Park, Caloocan',
    center: [120.9840, 14.6571],
    leavesCanopy: '3.9%',
    canopyNum: 3.9
  },
  {
    name: 'Malabon, Metro Manila',
    district: 'Tugatog',
    city: 'Malabon',
    state: 'Metro Manila',
    displayLocation: 'Tugatog, Malabon',
    center: [120.9567, 14.6625],
    leavesCanopy: '2.4%',
    canopyNum: 2.4
  },
  {
    name: 'Navotas, Metro Manila',
    district: 'Tondo / North Harbor',
    city: 'Navotas',
    state: 'Metro Manila',
    displayLocation: 'Tondo Border, Navotas',
    center: [120.9419, 14.6667],
    leavesCanopy: '1.8%',
    canopyNum: 1.8
  },
  {
    name: 'Valenzuela, Metro Manila',
    district: 'Karuhatan',
    city: 'Valenzuela',
    state: 'Metro Manila',
    displayLocation: 'Karuhatan, Valenzuela',
    center: [120.9830, 14.7011],
    leavesCanopy: '6.2%',
    canopyNum: 6.2
  },
  {
    name: 'Marikina, Metro Manila',
    district: 'Riverbanks',
    city: 'Marikina',
    state: 'Metro Manila',
    displayLocation: 'Riverbanks, Marikina',
    center: [121.1000, 14.6500],
    leavesCanopy: '11.5%',
    canopyNum: 11.5
  },
  {
    name: 'Pateros, Metro Manila',
    district: 'Poblacion',
    city: 'Pateros',
    state: 'Metro Manila',
    displayLocation: 'Poblacion, Pateros',
    center: [121.0667, 14.5444],
    leavesCanopy: '2.1%',
    canopyNum: 2.1
  },
  {
    name: 'Downtown Core, Singapore',
    district: 'Downtown Core / Marina Bay',
    city: 'Singapore',
    state: 'Singapore',
    displayLocation: 'Downtown Core, Singapore',
    center: [103.8519, 1.2903],
    leavesCanopy: '34.0%',
    canopyNum: 34.0
  }
];

export function getNearestCity([lng, lat]) {
  if (lat < 5.0) {
    return CITY_DATABASE.find(c => c.city === 'Singapore');
  }

  let minDistance = Infinity;
  let nearestCity = CITY_DATABASE[0];

  for (let i = 0; i < CITY_DATABASE.length; i++) {
    const city = CITY_DATABASE[i];
    if (city.city === 'Singapore') continue;

    const [cLng, cLat] = city.center;
    const dLng = lng - cLng;
    const dLat = lat - cLat;
    const distSq = (dLng * dLng) + (dLat * dLat);

    if (distSq < minDistance) {
      minDistance = distSq;
      nearestCity = city;
    }
  }

  return nearestCity;
}
