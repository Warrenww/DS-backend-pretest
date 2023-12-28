export type OHLCDataType = {
  timestamp: number;
  pair: string;
  open: number;
  high: number;
  low: number;
  close: number;
};

export type ConsumeResult =
  | {
      status: 'skip';
    }
  | {
      status: 'update';
      data: OHLCDataType;
    };
