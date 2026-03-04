export interface ManagementLayer {
  resources: string[];
  business_model: string;
  value: string;
}

export interface Strategy {
  owner: {
    name: string;
    role: string;
  };
  historical_context: ManagementLayer;
  future_ideal: ManagementLayer;
  strategic_challenges: string[];
  external_environment: {
    opportunity: string[];
    threat: string[];
  };
  consultation_items: string[];
  performance_manual?: {
    update_frequency: string;
  };
}
