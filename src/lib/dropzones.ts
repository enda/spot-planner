// Dropzone database.
//
// Coordinates point at the landing area / main runway of each parachuting
// airfield. They were verified against the OurAirports dataset (ICAO/airfield
// reference points), except the five hand-traced DZs below whose landing-zone
// polygons live in static/landing-zones.json — those coordinates come straight
// from that hand work and must not be "corrected".
//
// Hand-traced (trusted, do not touch): Gap-Tallard, Skydive Frétoy,
// 7ème Ciel (Lannion), Para-Club Namur (Temploux), Beni Mellal.

export interface Dropzone {
  name: string;
  country: string;
  lat: number;
  lng: number;
}

export interface Target {
  lat: number;
  lng: number;
  name: string;
  country: string;
}

export const DROPZONES: Dropzone[] = [
  // — Allemagne
  { name: 'Fallschirmsport Bienenfarm (Berlin)', country: 'Allemagne', lat: 52.661667, lng: 12.745833 },
  { name: 'Fehrbellin (Berlin)', country: 'Allemagne', lat: 52.793493, lng: 12.760324 },
  { name: 'Gransee', country: 'Allemagne', lat: 53.00628, lng: 13.202177 },
  { name: 'Saarlouis-Düren', country: 'Allemagne', lat: 49.3125, lng: 6.674444 },
  { name: 'Fallschirmsport Bruchsal', country: 'Allemagne', lat: 49.0975, lng: 8.59495 },
  // — Australie
  { name: 'Skydive Nagambie (Melbourne)', country: 'Australie', lat: -36.788471, lng: 145.039724 },
  { name: 'Skydive Ramblers (Toogoolawah)', country: 'Australie', lat: -27.0822, lng: 152.3733 },
  // — Autriche
  { name: 'Skydive Tirol (Reith)', country: 'Autriche', lat: 47.46379, lng: 11.95055 },
  { name: 'Skydive Wels', country: 'Autriche', lat: 48.182513, lng: 14.039283 },
  { name: 'Austrian Skydive (Wiener Neustadt)', country: 'Autriche', lat: 47.836933, lng: 16.221838 },
  // — Belgique
  { name: 'Para-Club Namur (Temploux)', country: 'Belgique', lat: 50.48947, lng: 4.772508 },
  { name: 'Skydive Cerfontaine', country: 'Belgique', lat: 50.152802, lng: 4.38722 },
  { name: 'Skydive Spa (La Sauvenière)', country: 'Belgique', lat: 50.482006, lng: 5.913434 },
  { name: 'Skydive Zwartberg (Genk)', country: 'Belgique', lat: 51.0154, lng: 5.52647 },
  { name: 'Para-Club Schaffen (Diest)', country: 'Belgique', lat: 51.004032, lng: 5.064697 },
  // — Croatie
  { name: 'Skydive Zadar', country: 'Croatie', lat: 44.096986, lng: 15.353565 },
  // — Espagne
  { name: 'Empuriabrava', country: 'Espagne', lat: 42.2479, lng: 3.1172 },
  { name: 'Skydive Spain (La Juliana, Sevilla)', country: 'Espagne', lat: 37.294998, lng: -6.1625 },
  { name: 'Skydive Madrid (Ocaña)', country: 'Espagne', lat: 39.9375, lng: -3.50333 },
  { name: 'Skydive Barcelona (Sabadell)', country: 'Espagne', lat: 41.520901, lng: 2.10508 },
  // — États-Unis
  { name: 'Skydive Arizona (Eloy)', country: 'États-Unis', lat: 32.806999, lng: -111.586998 },
  { name: 'Skydive Perris', country: 'États-Unis', lat: 33.760899, lng: -117.218002 },
  { name: 'Skydive DeLand', country: 'États-Unis', lat: 29.066999, lng: -81.283798 },
  { name: 'Skydive City (Zephyrhills)', country: 'États-Unis', lat: 28.228201, lng: -82.155899 },
  { name: 'Skydive Chicago (Ottawa)', country: 'États-Unis', lat: 41.399799, lng: -88.7939 },
  { name: 'Skydive Elsinore', country: 'États-Unis', lat: 33.632272, lng: -117.300868 },
  { name: 'Skydive California (Tracy)', country: 'États-Unis', lat: 37.731326, lng: -121.335589 },
  { name: 'Skydive Houston', country: 'États-Unis', lat: 29.993401, lng: -95.930298 },
  { name: 'Skydive Oregon (Molalla)', country: 'États-Unis', lat: 45.145363, lng: -122.618544 },
  { name: 'Skydive Cross Keys (NJ)', country: 'États-Unis', lat: 39.705502, lng: -75.032997 },
  { name: 'Skydive Sebastian (FL)', country: 'États-Unis', lat: 27.812599, lng: -80.495903 },
  { name: 'Skydive Carolina (Chester)', country: 'États-Unis', lat: 34.789299, lng: -81.195801 },
  { name: 'Skydive Orange (VA)', country: 'États-Unis', lat: 38.2472, lng: -78.045601 },
  { name: 'Skydive The Ranch (Gardiner)', country: 'États-Unis', lat: 41.6668, lng: -74.1496 },
  { name: 'Skydive Hollister (CA)', country: 'États-Unis', lat: 36.8933, lng: -121.41 },
  { name: 'Start Skydiving (Middletown)', country: 'États-Unis', lat: 39.530998, lng: -84.395302 },
  { name: 'Skydive Greene County (Xenia)', country: 'États-Unis', lat: 39.6792, lng: -83.8708 },
  { name: 'Skydive Iowa (Brooklyn)', country: 'États-Unis', lat: 41.745441, lng: -92.411547 },
  { name: 'Skydive Lebanon (Maine)', country: 'États-Unis', lat: 43.375, lng: -70.9292 },
  { name: 'Skydive San Joaquin Valley (Bakersfield)', country: 'États-Unis', lat: 35.097819, lng: -119.070961 },
  { name: 'Skydive West Plains (Ritzville)', country: 'États-Unis', lat: 47.15973, lng: -118.29638 },
  { name: 'Illinois Valley Parachute Club (Minier)', country: 'États-Unis', lat: 40.433943, lng: -89.356585 },
  // — Émirats
  { name: 'Skydive Dubai (Palm)', country: 'Émirats', lat: 25.090037, lng: 55.132345 },
  { name: 'Skydive Dubai (Desert Campus)', country: 'Émirats', lat: 24.928, lng: 55.272 },
  // — Finlande
  { name: 'Skydive Kiikala', country: 'Finlande', lat: 60.462502, lng: 23.6525 },
  { name: 'Skydive Finland (Jämijärvi)', country: 'Finlande', lat: 61.778599, lng: 22.716101 },
  // — France (FFP centres — coordinates are airfield reference points)
  { name: '7ème Ciel (Lannion)', country: 'France', lat: 48.752595, lng: -3.470757 },
  { name: 'Abbeville', country: 'France', lat: 50.143501, lng: 1.831891 },
  { name: 'Agen-La Garenne', country: 'France', lat: 44.174171, lng: 0.59309 },
  { name: 'Albi-Le Séquestre', country: 'France', lat: 43.913898, lng: 2.11306 },
  { name: 'Amiens-Glisy', country: 'France', lat: 49.873004, lng: 2.387074 },
  { name: 'Angers-Marcé', country: 'France', lat: 47.560299, lng: -0.312222 },
  { name: 'Aubenas-Lanas', country: 'France', lat: 44.544367, lng: 4.372194 },
  { name: 'Auch-Gers', country: 'France', lat: 43.683606, lng: 0.599747 },
  { name: 'Avignon-Pujaut', country: 'France', lat: 43.996899, lng: 4.75556 },
  { name: 'Besançon-Thise', country: 'France', lat: 47.273144, lng: 6.082885 },
  { name: 'Brienne-le-Château', country: 'France', lat: 48.430396, lng: 4.472487 },
  { name: 'Cahors-Lalbenque', country: 'France', lat: 44.351398, lng: 1.47528 },
  { name: 'Castres-Mazamet', country: 'France', lat: 43.556301, lng: 2.28918 },
  { name: 'Challes-les-Eaux (Chambéry)', country: 'France', lat: 45.5611, lng: 5.97576 },
  { name: 'Air Magic (Chambley)', country: 'France', lat: 49.025501, lng: 5.87607 },
  { name: 'Cholet', country: 'France', lat: 47.0821, lng: -0.877064 },
  { name: 'Colmar-Houssen', country: 'France', lat: 48.109901, lng: 7.35901 },
  { name: 'Couhé-Vérac', country: 'France', lat: 46.2728, lng: 0.190556 },
  { name: 'Dax', country: 'France', lat: 43.689201, lng: -1.06889 },
  { name: 'Dole-Tavaux', country: 'France', lat: 47.038955, lng: 5.427589 },
  { name: 'Étampes-Mondésir', country: 'France', lat: 48.381901, lng: 2.07528 },
  { name: 'Figeac-Livernon', country: 'France', lat: 44.673302, lng: 1.78917 },
  { name: 'Gap-Tallard', country: 'France', lat: 44.455667, lng: 6.035909 },
  { name: 'Graulhet-Montdragon', country: 'France', lat: 43.771099, lng: 2.01083 },
  { name: 'Grenoble-Le Versoud', country: 'France', lat: 45.218047, lng: 5.848317 },
  { name: 'Guiscriff-Scaër', country: 'France', lat: 48.052502, lng: -3.66472 },
  { name: 'Issoire-Le Broc', country: 'France', lat: 45.514999, lng: 3.2675 },
  { name: 'ParisJump (La Ferté-Gaucher)', country: 'France', lat: 48.757019, lng: 3.278098 },
  { name: 'La Môle (Saint-Tropez)', country: 'France', lat: 43.205399, lng: 6.482 },
  { name: 'Le Blanc', country: 'France', lat: 46.6208, lng: 1.0875 },
  { name: 'Le Luc-Le Cannet', country: 'France', lat: 43.384701, lng: 6.38714 },
  { name: 'Le Puy-Loudes', country: 'France', lat: 45.0807, lng: 3.76289 },
  { name: 'Le Touquet', country: 'France', lat: 50.518284, lng: 1.621656 },
  { name: 'Lézignan-Corbières', country: 'France', lat: 43.1758, lng: 2.73417 },
  { name: 'Lille-Bondues', country: 'France', lat: 50.687199, lng: 3.07556 },
  { name: 'Lyon-Corbas', country: 'France', lat: 45.654202, lng: 4.91361 },
  { name: 'Mâcon-Charnay', country: 'France', lat: 46.295131, lng: 4.795977 },
  { name: 'Marmande-Virazeil', country: 'France', lat: 44.499049, lng: 0.200511 },
  { name: 'Maubeuge-Élesmes', country: 'France', lat: 50.310501, lng: 4.03312 },
  { name: 'Montauban', country: 'France', lat: 44.0257, lng: 1.37804 },
  { name: 'Moulins-Montbeugny', country: 'France', lat: 46.534599, lng: 3.42372 },
  { name: 'Muret-Lherm (Toulouse)', country: 'France', lat: 43.448898, lng: 1.26333 },
  { name: 'Niort-Marais Poitevin', country: 'France', lat: 46.313477, lng: -0.394529 },
  { name: 'Ariège Parachutisme (Pamiers)', country: 'France', lat: 43.090599, lng: 1.69583 },
  { name: 'Orléans-Saint-Denis-de-l’Hôtel', country: 'France', lat: 47.897758, lng: 2.164478 },
  { name: 'Périgueux-Bassillac', country: 'France', lat: 45.198101, lng: 0.815556 },
  { name: 'Péronne-Saint-Quentin', country: 'France', lat: 49.868871, lng: 3.029566 },
  { name: 'Pontoise-Cormeilles', country: 'France', lat: 49.096064, lng: 2.035543 },
  { name: 'Quiberon', country: 'France', lat: 47.482201, lng: -3.1 },
  { name: 'Reims-Prunay', country: 'France', lat: 49.208698, lng: 4.15658 },
  { name: 'Roanne-Renaison', country: 'France', lat: 46.053818, lng: 3.999023 },
  { name: 'Rochefort-Saint-Agnant', country: 'France', lat: 45.887798, lng: -0.983056 },
  { name: 'Royan-Médis', country: 'France', lat: 45.628101, lng: -0.9725 },
  { name: 'Saumur-Saint-Florent', country: 'France', lat: 47.256802, lng: -0.115142 },
  { name: 'Sisteron-Vaumeilh', country: 'France', lat: 44.286471, lng: 5.929086 },
  { name: 'Skydive Frétoy', country: 'France', lat: 49.665904, lng: 2.969232 },
  { name: 'Soissons-Courmelles', country: 'France', lat: 49.344978, lng: 3.282681 },
  { name: 'Valence-Chabeuil', country: 'France', lat: 44.9216, lng: 4.9699 },
  { name: 'Vannes-Meucon', country: 'France', lat: 47.723301, lng: -2.71856 },
  { name: 'Vichy-Charmeil', country: 'France', lat: 46.16969, lng: 3.403637 },
  // — Italie
  { name: 'Reggio Emilia', country: 'Italie', lat: 44.698039, lng: 10.664885 },
  { name: 'Fano', country: 'Italie', lat: 43.824032, lng: 13.02588 },
  { name: 'Skydive Iseo', country: 'Italie', lat: 45.816298, lng: 10.096242 },
  { name: 'Skydive Thiene (Vicenza)', country: 'Italie', lat: 45.67783, lng: 11.496306 },
  { name: 'Skydive Venice (San Stino)', country: 'Italie', lat: 45.700009, lng: 12.763909 },
  // — Maroc
  { name: 'Beni Mellal', country: 'Maroc', lat: 32.394344, lng: -6.329198 },
  { name: 'Skydive Atlas (Taroudant)', country: 'Maroc', lat: 30.503487, lng: -8.821549 },
  // — Norvège
  { name: 'Skydive Voss (Bømoen)', country: 'Norvège', lat: 60.638098, lng: 6.499786 },
  { name: 'Skydive Tønsberg (Jarlsberg)', country: 'Norvège', lat: 59.299232, lng: 10.369844 },
  // — Pays-Bas
  { name: 'Skydive Teuge', country: 'Pays-Bas', lat: 52.242764, lng: 6.050004 },
  { name: 'Skydive Rotterdam (Midden-Zeeland)', country: 'Pays-Bas', lat: 51.512199, lng: 3.73111 },
  { name: 'Paracentrum Texel', country: 'Pays-Bas', lat: 53.114962, lng: 4.830552 },
  // — Portugal
  { name: 'Skydive Seven (Évora)', country: 'Portugal', lat: 38.533501, lng: -7.88964 },
  // — Royaume-Uni
  { name: 'Army Parachute Assoc. (Netheravon)', country: 'Royaume-Uni', lat: 51.2472, lng: -1.75425 },
  { name: 'Skydive Langar', country: 'Royaume-Uni', lat: 52.89593, lng: -0.90101 },
  { name: 'Skydive Hibaldstow (Target)', country: 'Royaume-Uni', lat: 53.495814, lng: -0.516922 },
  { name: 'Skydive Headcorn (Slipstream)', country: 'Royaume-Uni', lat: 51.156898, lng: 0.641667 },
  { name: 'Skydive Sibson (Peterborough)', country: 'Royaume-Uni', lat: 52.5571, lng: -0.386982 },
  { name: 'North London Skydiving (Chatteris)', country: 'Royaume-Uni', lat: 52.4873, lng: 0.089111 },
  { name: 'Skydive Strathallan', country: 'Royaume-Uni', lat: 56.324852, lng: -3.746366 },
  { name: 'Wild Geese (Coleraine)', country: 'Royaume-Uni', lat: 54.987625, lng: -6.644028 },
  // — Suède
  { name: 'Skydive Dala (Dala-Järna)', country: 'Suède', lat: 60.556099, lng: 14.3771 },
  // — Suisse
  { name: 'Para Centro Locarno', country: 'Suisse', lat: 46.162535, lng: 8.878908 },
  { name: 'Skydive Grenchen', country: 'Suisse', lat: 47.181599, lng: 7.41719 },
  { name: 'Skydive Luzern (Beromünster)', country: 'Suisse', lat: 47.188993, lng: 8.204556 },
  // — Tchéquie
  { name: 'Skydive Prostějov', country: 'Tchéquie', lat: 49.4478, lng: 17.1339 },
  { name: 'Skydive Klatovy', country: 'Tchéquie', lat: 49.418301, lng: 13.3219 },
  { name: 'Skydive Hradec Králové', country: 'Tchéquie', lat: 50.253201, lng: 15.8452 },
  { name: 'Skydive Vyškov', country: 'Tchéquie', lat: 49.300301, lng: 17.025299 },
  // — Brésil
  { name: 'Skydive Litoral (Saquarema)', country: 'Brésil', lat: -22.85, lng: -42.555833 },
  // — Canada
  { name: 'Skydive SWOOP (Hamilton)', country: 'Canada', lat: 43.301817, lng: -79.971832 },
  // — Danemark
  { name: 'Skydive Vesthimmerland (Aars)', country: 'Danemark', lat: 56.846613, lng: 9.460602 },
  // — Géorgie
  { name: 'Bolnisi (parachutisme)', country: 'Géorgie', lat: 41.48523, lng: 44.53348 },
  // — Hongrie
  { name: 'Őcsény', country: 'Hongrie', lat: 46.306138, lng: 18.767386 },
  // — Koweït
  { name: 'Skydive Kuwait', country: 'Koweït', lat: 28.60425, lng: 48.3093 },
  // — Maurice
  { name: 'Skydive Austral (Maurice)', country: 'Maurice', lat: -20.123793, lng: 57.681656 },
  // — Nouvelle-Zélande
  { name: 'Skydive Taupo', country: 'Nouvelle-Zélande', lat: -38.7397, lng: 176.084 },
  { name: 'Skydive Wanaka', country: 'Nouvelle-Zélande', lat: -44.722091, lng: 169.246287 },
  // — Pologne
  { name: 'Skydive Grudziądz', country: 'Pologne', lat: 53.524399, lng: 18.849199 },
  // — Thaïlande
  { name: 'Dropzone Thailand (Pattaya)', country: 'Thaïlande', lat: 12.6714, lng: 101.5476 },
];

/** Great-circle distance in kilometres (haversine). */
export function haversineKm(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const la1 = (a.lat * Math.PI) / 180;
  const la2 = (b.lat * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** Nearest dropzone to a position, with the distance in km. */
export function nearestDropzone(pos: { lat: number; lng: number }): {
  dz: Dropzone;
  km: number;
} {
  let best = DROPZONES[0];
  let bestKm = Infinity;
  for (const dz of DROPZONES) {
    const km = haversineKm(pos, dz);
    if (km < bestKm) {
      bestKm = km;
      best = dz;
    }
  }
  return { dz: best, km: bestKm };
}

export const dzToTarget = (dz: Dropzone): Target => ({
  lat: dz.lat,
  lng: dz.lng,
  name: dz.name,
  country: dz.country,
});
