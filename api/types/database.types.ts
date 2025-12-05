export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      // Define your database tables here as you create them
      [key: string]: unknown;
    };
    Views: {
      [key: string]: unknown;
    };
    Functions: {
      [key: string]: unknown;
    };
  };
}
