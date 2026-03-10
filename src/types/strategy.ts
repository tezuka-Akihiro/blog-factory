export interface ManagementLayer {
  resources: string[];
  business_model: string;
  value: string;
}

export interface SixW2H {
  who: string;
  whom: string;
  what: string;
  how: string;
  idea: string;
  why: string;
  when: string;
  where: string;
  how_much: string;
}

export interface Strategy {
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
  six_w2h?: SixW2H;
}
