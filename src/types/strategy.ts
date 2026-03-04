export interface Strategy {
  owner: {
    name: string;
    role: string;
  };
  management_design: {
    past_present: {
      experience: string;
      core_philosophy: string;
    };
    value_creation: {
      mechanism: string;
      benefit: string;
    };
    future_vision: {
      profit_goal: string;
      social_impact: string;
    };
  };
  performance_manual: {
    update_frequency: string;
  };
  today_agenda: string[];
}
