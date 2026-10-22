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
  name: 'Pemilik Kendaraan',
  email: '',
  phone: '',
  accountType: 'personal',
  licenses: [],
};
