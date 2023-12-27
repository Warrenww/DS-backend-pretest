export type SubscribeData = {
  data: {
    id: number;
    timestamp: string;
    amount: number;
    amount_str: string;
    price: number;
    price_str: string;
    type: 0 | 1;
    microtimestamp: string;
    buy_order_id: number;
    sell_order_id: number;
  };
  channel: string;
  event: string;
};
