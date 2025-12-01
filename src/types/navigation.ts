import { ExtractedPolicyData } from '../services/policy';

export type RootStackParamList = {
  PhoneLogin: undefined;
  OTPVerification: { phoneNumber: string };
  Home: undefined;
  MyPolicy: undefined;
  Insurance: undefined;
  LifeInsurance: undefined;
  HealthInsurance: undefined;
  PolicyVerification: {
    policyId: number;
    extractedData: ExtractedPolicyData;
  };
  PolicyDetail: { policyId: number };
  Properties: undefined;
  Tutorials: undefined;
  Service: undefined;
  SafeVault: undefined;
  Profile: undefined;
  AadhaarVerification: undefined;
};
