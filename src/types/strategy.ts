export interface Strategy {
  owner: {
    name: string;
    role: string;
  };
  management_design: {
    past_present: {
      experience: string;
      core_philosophy: string;
      assets: string[];
    };
    value_creation: {
      mechanism: string;
      benefit: string;
      strategy: string;
    };
    future_vision: {
      profit_goal: string;
      social_impact: string;
      milestone: string;
    };
  };
  external_environment?: {
    opportunity: string[];
    threat: string[];
  };
  performance_manual: {
    update_frequency: string;
  };
  today_agenda: string[];
}
