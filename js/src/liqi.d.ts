import Exchange from './abstract/liqi.js';
import { Ticker } from '../ccxt.js';
export default class liqi extends Exchange {
    describe(): any;
    costToPrecision(symbol: any, cost: any): any;
    currencyToPrecision(currency: any, fee: any): any;
    nonce(): number;
    fetchTime(params?: {}): Promise<number>;
    fetchCurrencies(limit: any, params?: {}): Promise<any>;
    fetchMarket(symbol: any, params?: {}): Promise<any>;
    fetchMarkets(params?: {}): Promise<any>;
    fetchOrder(id: any, params?: {}): Promise<any>;
    fetchOrders(symbol: any, limit: any, since?: any, params?: {}): Promise<any>;
    fetchBalance(params?: {}): Promise<any>;
    fetchOrderBook(symbol: any, limit?: any, params?: {}): Promise<any>;
    fetchTicker(symbol: any, params?: {}): Promise<any>;
    fetchTickers(limit: any, params?: {}): Promise<any>;
    parseTicker(ticker: any): Ticker;
    fetchOHLCV(symbol: any, internal?: string, limit?: number, params?: {}): Promise<any>;
    fetchTrades(symbol: any, limit?: any, params?: {}): Promise<any>;
    createOrder(symbol: any, type: any, side: any, amount?: any, price?: any, quoteAmount?: any, params?: {}): Promise<any>;
    fetchOpenOrders(symbol?: any, since?: any, limit?: any, params?: {}): Promise<any>;
    fetchClosedOrders(symbol?: any, since?: any, limit?: any, params?: {}): Promise<any[]>;
    cancelOrder(id: any, params?: {}): Promise<any>;
    cancelAllOrders(symbol?: any, params?: {}): Promise<any>;
    fetchOrderTrades(id: any, symbol?: any, since?: any, limit?: any, params?: {}): Promise<import("./base/types.js").Trade[]>;
    signEddsa(message: any): string;
    sign(path: any, api?: string, method?: string, params?: {}, headers?: any, body?: any): {
        url: string;
        method: string;
        body: any;
        headers: any;
    };
    handleErrors(code: any, reason: any, url: any, method: any, headers: any, body: any, response: any, requestHeaders: any, requestBody: any): any;
    request(path: any, api?: string, method?: string, params?: {}, headers?: any, body?: any, config?: {}, context?: {}): Promise<any>;
}
