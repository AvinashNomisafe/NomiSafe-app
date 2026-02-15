import { ExtractedPolicyData } from '../services/policy';

export type RootStackParamList = {
  PhoneLogin: undefined;
  OTPVerification: { phoneNumber: string };
  Home: undefined;
  MyPolicy: { policyId?: number };
  /** @deprecated Use LifeInsurance, HealthInsurance, or MotorInsurance instead */
  Insurance: undefined;
  LifeInsurance: undefined;
  HealthInsurance: undefined;
  MotorInsurance: undefined;
  AllPolicies: undefined;
  PolicyVerification: {
    policyId: number;
    extractedData: ExtractedPolicyData;
  };
  PolicyDetail: { policyId: number };
  Properties: undefined;
  FirstConnect: undefined;
  Tutorials: undefined;
  Service: undefined;
  SafeVault: undefined;
  NomineeDetails: undefined;
  Profile: undefined;
  AadhaarVerification: undefined;
  Dashboard: undefined;
};
