// Predefined organizations for different issue types
export interface Organization {
  id: string;
  name: string;
  description: string;
  issueTypes: IssueType[];
}

export type IssueType = 
  | 'waterlogging'
  | 'garbage'
  | 'roads'
  | 'public_places'
  | 'streetlights'
  | 'water_supply';

export const ORGANIZATIONS: Organization[] = [
  {
    id: 'bmc-drainage',
    name: 'BMC Stormwater Drain Department',
    description: 'Handles drainage systems and waterlogging issues in Mumbai',
    issueTypes: ['waterlogging']
  },
  {
    id: 'pwd',
    name: 'Public Works Department (PWD)',
    description: 'Responsible for construction and maintenance of public infrastructure',
    issueTypes: ['waterlogging', 'roads']
  },
  {
    id: 'mjp',
    name: 'Maharashtra Jeevan Pradhikaran (MJP)',
    description: 'Water supply and sanitation in Maharashtra',
    issueTypes: ['waterlogging', 'water_supply']
  },
  {
    id: 'mmrda',
    name: 'Mumbai Metropolitan Region Development Authority (MMRDA)',
    description: 'Infrastructure development in Mumbai Metropolitan Region',
    issueTypes: ['roads']
  },
  {
    id: 'bmc-waste',
    name: 'BMC Solid Waste Management Department',
    description: 'Waste collection and disposal in Mumbai',
    issueTypes: ['garbage']
  },
  {
    id: 'mpcb',
    name: 'Maharashtra Pollution Control Board (MPCB)',
    description: 'Monitoring and control of pollution in Maharashtra',
    issueTypes: ['garbage']
  },
  {
    id: 'sba',
    name: 'Swachh Bharat Abhiyan (SBA) Local Ward Office',
    description: 'Cleanliness mission at local level',
    issueTypes: ['garbage', 'public_places']
  },
  {
    id: 'muni-waste',
    name: 'Municipal Corporation Waste Management Division',
    description: 'Local waste management services',
    issueTypes: ['garbage']
  },
  {
    id: 'muni-roads',
    name: 'Municipal Road Maintenance Department',
    description: 'Road repair and maintenance at local level',
    issueTypes: ['roads']
  },
  {
    id: 'bmc-garden',
    name: 'BMC - Garden & Recreation Department',
    description: 'Maintenance of public parks and gardens',
    issueTypes: ['public_places']
  },
  {
    id: 'muda',
    name: 'Mumbai Urban Development Authority (MUDA)',
    description: 'Urban planning and development in Mumbai',
    issueTypes: ['public_places']
  },
  {
    id: 'suda',
    name: 'State Urban Development Authority (SUDA)',
    description: 'Urban planning at state level',
    issueTypes: ['public_places']
  },
  {
    id: 'muni-parks',
    name: 'Municipal Park Maintenance Division',
    description: 'Maintenance of local parks and recreational areas',
    issueTypes: ['public_places']
  },
  {
    id: 'mseb',
    name: 'Maharashtra State Electricity Board (MSEB)',
    description: 'Electricity supply and infrastructure in Maharashtra',
    issueTypes: ['streetlights']
  },
  {
    id: 'tata-power',
    name: 'Tata Power',
    description: 'Private electricity distribution company',
    issueTypes: ['streetlights']
  },
  {
    id: 'adani-electricity',
    name: 'Adani Electricity Mumbai',
    description: 'Private electricity distribution company',
    issueTypes: ['streetlights']
  },
  {
    id: 'local-electricity',
    name: 'Local Municipal Electricity Department',
    description: 'Municipal electricity distribution and maintenance',
    issueTypes: ['streetlights']
  },
  {
    id: 'bmc-water',
    name: 'BMC Water Supply Department',
    description: 'Water supply and distribution in Mumbai',
    issueTypes: ['water_supply']
  },
  {
    id: 'water-management',
    name: 'City Water Management Authorities',
    description: 'Local water supply and management',
    issueTypes: ['water_supply']
  }
];

export const ISSUE_TYPES = [
  { id: 'waterlogging', label: 'Waterlogging & Drainage Issues' },
  { id: 'garbage', label: 'Garbage Overflow & Waste Management' },
  { id: 'roads', label: 'Road Maintenance & Potholes' },
  { id: 'public_places', label: 'Unmaintained Public Places' },
  { id: 'streetlights', label: 'Streetlight & Electricity Issues' },
  { id: 'water_supply', label: 'Broken Pipelines & Water Supply Issues' }
];

// Get organizations filtered by issue type
export function getOrganizationsByIssueType(issueType: IssueType): Organization[] {
  return ORGANIZATIONS.filter(org => org.issueTypes.includes(issueType));
}

// Get all organizations
export function getAllOrganizations(): Organization[] {
  return ORGANIZATIONS;
} 