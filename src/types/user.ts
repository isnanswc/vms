export interface DriverLicense {
  id: string;
  simType: 'SIM A' | 'SIM B1' | 'SIM B2' | 'SIM C' | 'SIM C1' | 'SIM D';
  simNumber: string;
  holderName: string;
  expiryDate: string; // YYYY-MM-DD
  issuingCity?: string;
}

export interface UserProfile {
  name: string;
  email: string;
  phone: string;
  accountType: 'personal' | 'fleet_admin';
  companyName?: string;
  licenses: DriverLicense[];
}

export const INITIAL_USER_PROFILE: UserProfile = {
  name: 'Isnandar Saputra',
  email: 'isnandar.dev@gmail.com',
  phone: '0812-9842-1029',
  accountType: 'personal',
  licenses: [
    {
      id: 'sim-1',
      simType: 'SIM C',
      simNumber: '9402-1209-00214',
      holderName: 'ISNANDAR SAPUTRA',
      expiryDate: '2027-08-14',
      issuingCity: 'Polda Metro Jaya (Jakarta)',
    },
    {
      id: 'sim-2',
      simType: 'SIM A',
      simNumber: '9201-1904-00185',
      holderName: 'ISNANDAR SAPUTRA',
      expiryDate: '2026-11-20', // Jatuh tempo 1 bulan lagi!
      issuingCity: 'Polres Metro Jakarta Selatan',
    },
  ],
};
