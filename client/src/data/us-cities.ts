export type CityInfo = {
  slug: string; // e.g., "new-york"
  city: string; // "New York City"
  state: string; // "New York"
  metroAreas: string[]; // neighborhoods/areas
};

export const US_CITIES: CityInfo[] = [
  { slug: "new-york", city: "New York City", state: "New York", metroAreas: ["Manhattan", "Brooklyn", "Queens", "Bronx", "Staten Island"] },
  { slug: "los-angeles", city: "Los Angeles", state: "California", metroAreas: ["Hollywood", "Beverly Hills", "Santa Monica", "Downtown LA", "Venice"] },
  { slug: "chicago", city: "Chicago", state: "Illinois", metroAreas: ["The Loop", "Lincoln Park", "Hyde Park", "River North"] },
  { slug: "houston", city: "Houston", state: "Texas", metroAreas: ["Downtown", "Midtown", "Sugar Land", "Katy", "The Heights"] },
  { slug: "phoenix", city: "Phoenix", state: "Arizona", metroAreas: ["Downtown Phoenix", "Scottsdale", "Tempe", "Glendale", "Mesa"] },
  { slug: "philadelphia", city: "Philadelphia", state: "Pennsylvania", metroAreas: ["Center City", "South Philly", "University City", "Old City"] },
  { slug: "san-antonio", city: "San Antonio", state: "Texas", metroAreas: ["Downtown", "Stone Oak", "Alamo Heights", "The Pearl"] },
  { slug: "san-diego", city: "San Diego", state: "California", metroAreas: ["Gaslamp Quarter", "La Jolla", "Pacific Beach", "Little Italy"] },
  { slug: "dallas", city: "Dallas", state: "Texas", metroAreas: ["Downtown Dallas", "Uptown", "Deep Ellum", "Plano", "Frisco"] },
  { slug: "san-jose", city: "San Jose", state: "California", metroAreas: ["Downtown", "Santana Row", "Willow Glen", "Alum Rock"] },
  { slug: "austin", city: "Austin", state: "Texas", metroAreas: ["Downtown", "South Congress", "Domain", "East Austin"] },
  { slug: "jacksonville", city: "Jacksonville", state: "Florida", metroAreas: ["Downtown", "Riverside", "Southside", "Beaches"] },
  { slug: "fort-worth", city: "Fort Worth", state: "Texas", metroAreas: ["Downtown", "Stockyards", "Cultural District", "Arlington"] },
  { slug: "columbus", city: "Columbus", state: "Ohio", metroAreas: ["Downtown", "Short North", "German Village", "Dublin"] },
  { slug: "charlotte", city: "Charlotte", state: "North Carolina", metroAreas: ["Uptown", "South End", "NoDa", "Ballantyne"] },
  { slug: "san-francisco", city: "San Francisco", state: "California", metroAreas: ["SoMa", "Mission", "Sunset", "Nob Hill"] },
  { slug: "indianapolis", city: "Indianapolis", state: "Indiana", metroAreas: ["Downtown", "Broad Ripple", "Fountain Square", "Carmel"] },
  { slug: "seattle", city: "Seattle", state: "Washington", metroAreas: ["Downtown", "Capitol Hill", "Ballard", "Queen Anne"] },
  { slug: "denver", city: "Denver", state: "Colorado", metroAreas: ["Downtown", "LoDo", "Capitol Hill", "Cherry Creek"] },
  { slug: "washington-dc", city: "Washington, D.C.", state: "District of Columbia", metroAreas: ["Downtown", "Georgetown", "Capitol Hill", "Dupont Circle"] },
  { slug: "boston", city: "Boston", state: "Massachusetts", metroAreas: ["Back Bay", "Seaport", "Cambridge", "Somerville"] },
  { slug: "nashville", city: "Nashville", state: "Tennessee", metroAreas: ["Downtown", "The Gulch", "East Nashville", "Green Hills"] },
  { slug: "detroit", city: "Detroit", state: "Michigan", metroAreas: ["Downtown", "Midtown", "Corktown", "Royal Oak"] },
  { slug: "portland", city: "Portland", state: "Oregon", metroAreas: ["Downtown", "Pearl District", "Hawthorne", "Beaverton"] },
  { slug: "las-vegas", city: "Las Vegas", state: "Nevada", metroAreas: ["The Strip", "Downtown", "Summerlin", "Henderson"] },
];

export function findUSCity(slug: string): CityInfo | undefined {
  return US_CITIES.find((c) => c.slug === slug);
}