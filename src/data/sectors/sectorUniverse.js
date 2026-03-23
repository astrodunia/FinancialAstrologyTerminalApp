import rawSectors from '../../../sectors.json';
import { SECTORS } from './sectorConfig';

export const SECTOR_PAGE_SIZE = 15;

export const SECTOR_COLLECTION = SECTORS.map((sector, index) => {
  const tickers = Array.isArray(rawSectors?.[sector.apiSectorName]) ? rawSectors[sector.apiSectorName] : [];

  return {
    ...sector,
    id: `${sector.slug}-${index}`,
    tickers,
    preview: tickers.slice(0, 4),
    count: tickers.length,
    totalPages: Math.max(1, Math.ceil(tickers.length / SECTOR_PAGE_SIZE)),
  };
});

export const SECTOR_BY_SLUG = SECTOR_COLLECTION.reduce((acc, sector) => {
  acc[sector.slug] = sector;
  return acc;
}, {});

export const getSectorPage = (sector, page = 1) => {
  const tickers = Array.isArray(sector?.tickers) ? sector.tickers : [];
  const safePage = Math.max(1, page);
  const start = (safePage - 1) * SECTOR_PAGE_SIZE;

  return tickers.slice(start, start + SECTOR_PAGE_SIZE);
};
