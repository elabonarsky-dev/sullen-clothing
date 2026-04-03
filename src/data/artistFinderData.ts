/**
 * Raw artist data imported from the Sullen Artist Directory project.
 * Re-exports all 400+ artists from the complete dataset.
 */

import { ARTISTS } from "./allArtistsRaw";

export interface RawFinderArtist {
  id: number;
  name: string;
  handle: string;
  region: string;
  styles: string[];
  sullen: boolean;
  featured: boolean;
  bio: string;
  rating: number;
  pieces: number;
  available: boolean;
  photo: string;
}

/* ── Location derivation helpers ── */
const US_CITY_KW: [string, string][] = [
  ["San Diego","CA"],["Los Angeles","CA"],["LA","CA"],["Sacramento","CA"],
  ["San Francisco","CA"],["Oakland","CA"],["Anaheim","CA"],["Riverside","CA"],
  ["SoCal","CA"],["Central Coast","CA"],["Bay Area","CA"],["West Coast","CA"],
  ["Hollywood","CA"],["Long Beach","CA"],["Ventura","CA"],
  ["Dallas","TX"],["Houston","TX"],["Austin","TX"],["San Antonio","TX"],["Fort Worth","TX"],["Elm Street","TX"],
  ["New York","NY"],["NYC","NY"],["Brooklyn","NY"],["Manhattan","NY"],
  ["Miami","FL"],["Orlando","FL"],["Tampa","FL"],["Jacksonville","FL"],["Fort Lauderdale","FL"],
  ["Atlanta","GA"],["Savannah","GA"],
  ["Chicago","IL"],
  ["Philadelphia","PA"],["Pittsburgh","PA"],["Philly","PA"],
  ["Cleveland","OH"],["Columbus","OH"],["Cincinnati","OH"],["Middletown","OH"],
  ["Detroit","MI"],
  ["Denver","CO"],["Boulder","CO"],
  ["Seattle","WA"],["Tacoma","WA"],
  ["Portland","OR"],
  ["Las Vegas","NV"],["Vegas","NV"],["Reno","NV"],
  ["Phoenix","AZ"],["Scottsdale","AZ"],["Tucson","AZ"],
  ["Charlotte","NC"],["Raleigh","NC"],
  ["Nashville","TN"],["Memphis","TN"],
  ["New Orleans","LA"],
  ["Boston","MA"],
  ["Baltimore","MD"],
  ["Indianapolis","IN"],
  ["St. Louis","MO"],["Kansas City","MO"],
  ["Minneapolis","MN"],
  ["Milwaukee","WI"],
  ["Hartford","CT"],
  ["Jersey","NJ"],
  ["Richmond","VA"],["Virginia Beach","VA"],
  ["Charleston","SC"],
  ["Salt Lake","UT"],
  ["Oklahoma City","OK"],["Tulsa","OK"],
  ["Honolulu","HI"],["Hawaii","HI"],
  ["Albuquerque","NM"],
  ["Birmingham","AL"],
  ["Louisville","KY"],
  ["Des Moines","IA"],
  ["Omaha","NE"],
  ["Bozeman","MT"],
  ["Boise","ID"],
  ["Little Rock","AR"],
  ["Jackson","MS"],
  ["Wichita","KS"],
];

const COUNTRY_KW: [string, string][] = [
  ["Italian","Italy"],["Russian","Russia"],["German","Germany"],
  ["Ukrainian","Ukraine"],["Czech","Czech Republic"],["French","France"],
  ["British","UK"],["Spanish","Spain"],["Polish","Poland"],
  ["Finnish","Finland"],["Estonian","Estonia"],["Austrian","Austria"],
  ["Danish","Denmark"],["Belgian","Belgium"],["Greek","Greece"],
  ["Lithuanian","Lithuania"],["Bulgarian","Bulgaria"],["Scandinavian","Scandinavia"],
  ["Brazilian","Brazil"],["Colombian","Colombia"],["Korean","South Korea"],
  ["Filipino","Philippines"],["Malaysian","Malaysia"],
  ["Argentine","Argentina"],["Chilean","Chile"],
  ["Indonesian","Indonesia"],["Turkish","Turkey"],["Canadian","Canada"],
  ["Thai-Canadian","Canada"],
];

export function deriveLocation(region: string, bio: string): string {
  if (region === "California") {
    if (bio.includes("San Diego") || bio.includes("619")) return "San Diego, CA";
    if (bio.includes("Sacramento")) return "Sacramento, CA";
    if (bio.includes("Central Coast")) return "Ventura, CA";
    if (bio.includes("San Francisco") || bio.includes("Bay Area")) return "San Francisco, CA";
    if (bio.includes("Anaheim")) return "Anaheim, CA";
    return "Los Angeles, CA";
  }
  if (region === "US - Other") {
    for (const [kw, st] of US_CITY_KW) {
      if (bio.includes(kw)) return `${kw}, ${st}`;
    }
    return "United States";
  }
  if (region === "Europe" || region === "International") {
    for (const [kw, country] of COUNTRY_KW) {
      if (bio.includes(kw)) return country;
    }
    if (bio.includes("Sydney")) return "Sydney, Australia";
    if (bio.includes("Melbourne")) return "Melbourne, Australia";
  }
  if (region === "Australia") {
    if (bio.includes("Sydney")) return "Sydney, Australia";
    if (bio.includes("Melbourne")) return "Melbourne, Australia";
    return "Australia";
  }
  return region;
}

export function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

/** Derive region string from structured location fields */
function deriveRegionFromLocation(a: { state?: string | null; country?: string | null }): string {
  if (a.state === "CA") return "California";
  if (a.state) return "US - Other";
  const c = (a.country || "").toUpperCase();
  if (c === "US") return "US - Other";
  if (c === "AU") return "Australia";
  if (c === "EU" || ["IT","UK","DE","ES","FR","RU","UA"].includes(c)) return "Europe";
  return "International";
}

/** Convert all artists from the complete dataset to RawFinderArtist format */
export const RAW_FINDER_ARTISTS: RawFinderArtist[] = ARTISTS.map((a) => ({
  id: a.id,
  name: a.name,
  handle: a.handle,
  region: deriveRegionFromLocation(a),
  styles: a.styles,
  sullen: a.sullen,
  featured: a.featured,
  bio: a.bio,
  rating: a.rating,
  pieces: a.pieces,
  available: a.available,
  photo: a.photo,
}));
