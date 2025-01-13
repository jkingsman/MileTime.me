export interface StandardDistance {
  id: string;
  name: string;
  longName?: string;
  distance: number;
  defaultEnabled?: boolean;
  important?: boolean;
}

export interface CustomDistance {
  enabled?: boolean;
  value?: number;
  unit?: string;
}
