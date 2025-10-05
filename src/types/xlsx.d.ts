declare module 'xlsx' {
  export interface WorkBook {
    SheetNames: string[];
    Sheets: Record<string, any>;
  }
  export const utils: {
    sheet_to_csv: (ws: any, opts?: any) => string;
  };
  export function read(data: any, opts?: any): WorkBook;
}