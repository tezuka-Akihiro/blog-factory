export interface Strategy {
  vision: {
    catchphrase: string;
  };
  historical_context: {
    assets: string[];
    business_model: string;
    value_offered: string;
  };
  future_ideal: {
    target_date: string;
    best_strength: string;
    external_environment: {
      opportunity: string[];
      threat: string[];
    };
    business_model: {
      target_audience: string;
      offering: string;
      how_to_deliver: string;
    };
    value_offered: string;
  };
  strategic_challenges: {
    weakness_to_solve: string[];
    actions: string[];
  };
  consultation_items: string[];
}
