export type Sector =
  | "Apartments"
  | "Industrial"
  | "Shopping Center"
  | "Net Lease"
  | "Healthcare"
  | "Self Storage"
  | "Office"
  | "Hotels"
  | "Data Centers"
  | "Towers"
  | "Manufactured Housing"
  | "Timber"
  | "Specialty";

export interface REITInfo {
  ticker: string;
  name: string;
  sector: Sector;
  website?: string;
  ir?: string;
}

export const REIT_UNIVERSE: REITInfo[] = [
  // Apartments
  { ticker: "EQR",  name: "Equity Residential",          sector: "Apartments",          website: "https://www.equityresidential.com",    ir: "https://ir.equityresidential.com" },
  { ticker: "AVB",  name: "AvalonBay Communities",        sector: "Apartments",          website: "https://www.avalonbay.com",            ir: "https://investors.avalonbay.com" },
  { ticker: "ESS",  name: "Essex Property Trust",         sector: "Apartments",          website: "https://www.essexapartmenthomes.com",  ir: "https://ir.essexapartmenthomes.com" },
  { ticker: "MAA",  name: "Mid-America Apartment",        sector: "Apartments",          website: "https://www.maac.com",                 ir: "https://ir.maac.com" },
  { ticker: "UDR",  name: "UDR Inc.",                     sector: "Apartments",          website: "https://www.udr.com",                  ir: "https://ir.udr.com" },
  { ticker: "CPT",  name: "Camden Property Trust",        sector: "Apartments",          website: "https://www.camdenliving.com",         ir: "https://ir.camdenliving.com" },
  { ticker: "AIRC", name: "Apartment Income REIT",        sector: "Apartments",          website: "https://www.aircommunities.com",       ir: "https://ir.aircommunities.com" },
  // Industrial
  { ticker: "PLD",  name: "Prologis",                     sector: "Industrial",          website: "https://www.prologis.com",             ir: "https://ir.prologis.com" },
  { ticker: "DRE",  name: "Duke Realty",                  sector: "Industrial",          website: "https://www.prologis.com",             ir: "https://ir.prologis.com" },
  { ticker: "EGP",  name: "EastGroup Properties",         sector: "Industrial",          website: "https://www.eastgroup.net",            ir: "https://investors.eastgroup.net" },
  { ticker: "REXR", name: "Rexford Industrial",           sector: "Industrial",          website: "https://www.rexfordindustrial.com",    ir: "https://ir.rexfordindustrial.com" },
  { ticker: "FR",   name: "First Industrial Realty",      sector: "Industrial",          website: "https://www.firstindustrial.com",      ir: "https://ir.firstindustrial.com" },
  { ticker: "STAG", name: "STAG Industrial",              sector: "Industrial",          website: "https://www.stagindustrial.com",       ir: "https://ir.stagindustrial.com" },
  // Shopping Center
  { ticker: "REG",  name: "Regency Centers",              sector: "Shopping Center",     website: "https://www.regencycenters.com",       ir: "https://investors.regencycenters.com" },
  { ticker: "KIM",  name: "Kimco Realty",                 sector: "Shopping Center",     website: "https://www.kimcorealty.com",          ir: "https://ir.kimcorealty.com" },
  { ticker: "FRT",  name: "Federal Realty Investment Trust", sector: "Shopping Center",  website: "https://www.federalrealty.com",        ir: "https://investors.federalrealty.com" },
  { ticker: "RPAI", name: "Inland Real Estate",           sector: "Shopping Center",     website: "https://www.rpai.com",                 ir: "https://www.rpai.com/investor-relations" },
  { ticker: "BRX",  name: "Brixmor Property Group",       sector: "Shopping Center",     website: "https://www.brixmor.com",              ir: "https://ir.brixmor.com" },
  { ticker: "ROIC", name: "Retail Opportunity Investments", sector: "Shopping Center",   website: "https://www.roicapital.com",           ir: "https://ir.roicapital.com" },
  // Net Lease
  { ticker: "O",    name: "Realty Income",                sector: "Net Lease",           website: "https://www.realtyincome.com",         ir: "https://investors.realtyincome.com" },
  { ticker: "NNN",  name: "NNN REIT",                     sector: "Net Lease",           website: "https://www.nnnreit.com",              ir: "https://ir.nnnreit.com" },
  { ticker: "EPRT", name: "Essential Properties Realty",  sector: "Net Lease",           website: "https://www.essentialproperties.com",  ir: "https://ir.essentialproperties.com" },
  { ticker: "ADC",  name: "Agree Realty",                 sector: "Net Lease",           website: "https://www.agreerealty.com",          ir: "https://ir.agreerealty.com" },
  { ticker: "SRC",  name: "Spirit Realty Capital",        sector: "Net Lease",           website: "https://www.spiritrealty.com",         ir: "https://ir.spiritrealty.com" },
  { ticker: "NTST", name: "NETSTREIT Corp",               sector: "Net Lease",           website: "https://www.netstreit.com",            ir: "https://ir.netstreit.com" },
  // Healthcare
  { ticker: "WELL", name: "Welltower",                    sector: "Healthcare",          website: "https://www.welltower.com",            ir: "https://ir.welltower.com" },
  { ticker: "VTR",  name: "Ventas",                       sector: "Healthcare",          website: "https://www.ventasreit.com",           ir: "https://investors.ventasreit.com" },
  { ticker: "PEAK", name: "Healthpeak Properties",        sector: "Healthcare",          website: "https://www.healthpeak.com",           ir: "https://ir.healthpeak.com" },
  { ticker: "OHI",  name: "Omega Healthcare Investors",   sector: "Healthcare",          website: "https://www.omegahealthcare.com",      ir: "https://ir.omegahealthcare.com" },
  { ticker: "SABR", name: "Sabra Health Care REIT",       sector: "Healthcare",          website: "https://www.sabrahealth.com",          ir: "https://ir.sabrahealth.com" },
  // Self Storage
  { ticker: "PSA",  name: "Public Storage",               sector: "Self Storage",        website: "https://www.publicstorage.com",        ir: "https://ir.publicstorage.com" },
  { ticker: "EXR",  name: "Extra Space Storage",          sector: "Self Storage",        website: "https://www.extraspace.com",           ir: "https://ir.extraspace.com" },
  { ticker: "CUBE", name: "CubeSmart",                    sector: "Self Storage",        website: "https://www.cubesmart.com",            ir: "https://ir.cubesmart.com" },
  { ticker: "LSI",  name: "Life Storage",                 sector: "Self Storage",        website: "https://www.extraspace.com",           ir: "https://ir.extraspace.com" },
  { ticker: "NSA",  name: "National Storage Affiliates",  sector: "Self Storage",        website: "https://www.nsareit.com",              ir: "https://ir.nsareit.com" },
  // Office
  { ticker: "BXP",  name: "Boston Properties",            sector: "Office",              website: "https://www.bxp.com",                  ir: "https://ir.bxp.com" },
  { ticker: "SLG",  name: "SL Green Realty",              sector: "Office",              website: "https://www.slgreen.com",              ir: "https://ir.slgreen.com" },
  { ticker: "VNO",  name: "Vornado Realty Trust",         sector: "Office",              website: "https://www.vno.com",                  ir: "https://ir.vno.com" },
  { ticker: "HIW",  name: "Highwoods Properties",         sector: "Office",              website: "https://www.highwoods.com",            ir: "https://ir.highwoods.com" },
  // Hotels
  { ticker: "HST",  name: "Host Hotels & Resorts",        sector: "Hotels",              website: "https://www.hosthotels.com",           ir: "https://ir.hosthotels.com" },
  { ticker: "RHP",  name: "Ryman Hospitality Properties", sector: "Hotels",              website: "https://www.rymanhp.com",              ir: "https://ir.rymanhp.com" },
  { ticker: "PK",   name: "Park Hotels & Resorts",        sector: "Hotels",              website: "https://www.pkhotels.com",             ir: "https://ir.pkhotels.com" },
  { ticker: "SHO",  name: "Sunstone Hotel Investors",     sector: "Hotels",              website: "https://www.sunstonehotel.com",        ir: "https://ir.sunstonehotel.com" },
  // Data Centers
  { ticker: "EQIX", name: "Equinix",                      sector: "Data Centers",        website: "https://www.equinix.com",              ir: "https://ir.equinix.com" },
  { ticker: "DLR",  name: "Digital Realty Trust",         sector: "Data Centers",        website: "https://www.digitalrealty.com",        ir: "https://ir.digitalrealty.com" },
  { ticker: "IRM",  name: "Iron Mountain",                sector: "Data Centers",        website: "https://www.ironmountain.com",         ir: "https://ir.ironmountain.com" },
  { ticker: "QTS",  name: "QTS Realty Trust",             sector: "Data Centers",        website: "https://www.qtsdatacenters.com",       ir: "https://www.qtsdatacenters.com/investors" },
  // Towers
  { ticker: "AMT",  name: "American Tower",               sector: "Towers",              website: "https://www.americantower.com",        ir: "https://ir.americantower.com" },
  { ticker: "CCI",  name: "Crown Castle",                 sector: "Towers",              website: "https://www.crowncastle.com",          ir: "https://ir.crowncastle.com" },
  { ticker: "SBAC", name: "SBA Communications",           sector: "Towers",              website: "https://www.sbasite.com",              ir: "https://ir.sbasite.com" },
  // Manufactured Housing
  { ticker: "SUI",  name: "Sun Communities",              sector: "Manufactured Housing", website: "https://www.suncommunities.com",      ir: "https://ir.suncommunities.com" },
  { ticker: "ELS",  name: "Equity LifeStyle Properties",  sector: "Manufactured Housing", website: "https://www.equitylifestyle.com",    ir: "https://ir.equitylifestyle.com" },
  { ticker: "UMH",  name: "UMH Properties",               sector: "Manufactured Housing", website: "https://www.umh.com",               ir: "https://www.umh.com/investor-relations" },
  // Timber
  { ticker: "WY",   name: "Weyerhaeuser",                 sector: "Timber",              website: "https://www.weyerhaeuser.com",         ir: "https://ir.weyerhaeuser.com" },
  { ticker: "PCH",  name: "PotlatchDeltic",               sector: "Timber",              website: "https://www.potlatchdeltic.com",       ir: "https://ir.potlatchdeltic.com" },
  // Specialty
  { ticker: "SPG",  name: "Simon Property Group",         sector: "Specialty",           website: "https://www.simon.com",               ir: "https://investors.simon.com" },
  { ticker: "VICI", name: "VICI Properties",              sector: "Specialty",           website: "https://www.viciproperties.com",       ir: "https://ir.viciproperties.com" },
  { ticker: "GLPI", name: "Gaming and Leisure Properties", sector: "Specialty",          website: "https://www.glpropinc.com",            ir: "https://ir.glpropinc.com" },
  { ticker: "EPR",  name: "EPR Properties",               sector: "Specialty",           website: "https://www.eprkc.com",               ir: "https://ir.eprkc.com" },
];

export const SECTORS: Sector[] = [
  "Apartments",
  "Industrial",
  "Shopping Center",
  "Net Lease",
  "Healthcare",
  "Self Storage",
  "Office",
  "Hotels",
  "Data Centers",
  "Towers",
  "Manufactured Housing",
  "Timber",
  "Specialty",
];

export function getPeersBySector(sector: Sector): string[] {
  return REIT_UNIVERSE.filter((r) => r.sector === sector).map((r) => r.ticker);
}

export function getREITInfo(ticker: string): REITInfo | undefined {
  return REIT_UNIVERSE.find((r) => r.ticker === ticker);
}
