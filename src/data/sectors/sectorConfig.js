import {
  Cpu,
  Stethoscope,
  Landmark,
  Radio,
  ShoppingBag,
  ShoppingCart,
  Flame,
  Factory,
  FlaskConical,
  Building2,
  Zap,
} from 'lucide-react-native';

export const SECTORS = [
  {
    name: 'Tech',
    slug: 'technology',
    apiSectorName: 'Information Technology',
    subtitle: 'Technology dashboard',
    icon: Cpu,
    color: '#5B7CFA',
  },
  {
    name: 'Health Care',
    slug: 'health-care',
    apiSectorName: 'Health Care',
    subtitle: 'Health Care dashboard',
    icon: Stethoscope,
    color: '#EF5A8A',
  },
  {
    name: 'Financials',
    slug: 'financials',
    apiSectorName: 'Financials',
    subtitle: 'Financials dashboard',
    icon: Landmark,
    color: '#28C7A1',
  },
  {
    name: 'Communication Services',
    slug: 'communication-services',
    apiSectorName: 'Communication Services',
    subtitle: 'Communication Services dashboard',
    icon: Radio,
    color: '#A855F7',
  },
  {
    name: 'Consumer Discretionary',
    slug: 'consumer-discretionary',
    apiSectorName: 'Consumer Discretionary',
    subtitle: 'Consumer Discretionary dashboard',
    icon: ShoppingBag,
    color: '#F59E0B',
  },
  {
    name: 'Consumer Staples',
    slug: 'consumer-staples',
    apiSectorName: 'Consumer Staples',
    subtitle: 'Consumer Staples dashboard',
    icon: ShoppingCart,
    color: '#6CCB47',
  },
  {
    name: 'Energy',
    slug: 'energy',
    apiSectorName: 'Energy',
    subtitle: 'Energy dashboard',
    icon: Flame,
    color: '#F97316',
  },
  {
    name: 'Industrials',
    slug: 'industrials',
    apiSectorName: 'Industrials',
    subtitle: 'Industrials dashboard',
    icon: Factory,
    color: '#7C8596',
  },
  {
    name: 'Materials',
    slug: 'materials',
    apiSectorName: 'Materials',
    subtitle: 'Materials dashboard',
    icon: FlaskConical,
    color: '#22B5E2',
  },
  {
    name: 'Real Estate',
    slug: 'real-estate',
    apiSectorName: 'Real Estate',
    subtitle: 'Real Estate dashboard',
    icon: Building2,
    color: '#9B5DE5',
  },
  {
    name: 'Utilities',
    slug: 'utilities',
    apiSectorName: 'Utilities',
    subtitle: 'Utilities dashboard',
    icon: Zap,
    color: '#EAB308',
  },
];

export const SLUG_TO_SECTOR = SECTORS.reduce((acc, item) => {
  acc[item.slug] = item;
  return acc;
}, {});