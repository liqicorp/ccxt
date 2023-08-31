import { implicitReturnType } from '../base/types.js';
import { Exchange as _Exchange } from '../base/Exchange.js';
interface Exchange {
    publicGetFetchMarket(params?: {}): Promise<implicitReturnType>;
    publicGetFetchMarkets(params?: {}): Promise<implicitReturnType>;
    publicGetFetchCurrencies(params?: {}): Promise<implicitReturnType>;
    publicGetFetchTickers(params?: {}): Promise<implicitReturnType>;
    publicGetFetchTicker(params?: {}): Promise<implicitReturnType>;
    publicGetFetchOrderBook(params?: {}): Promise<implicitReturnType>;
    publicGetFetchOHLCV(params?: {}): Promise<implicitReturnType>;
    privateGetFetchBalance(params?: {}): Promise<implicitReturnType>;
    privateGetFetchMyOrders(params?: {}): Promise<implicitReturnType>;
    privateGetFetchOrders(params?: {}): Promise<implicitReturnType>;
    privateGetFetchClosedOrders(params?: {}): Promise<implicitReturnType>;
    privateGetFetchOpenOrders(params?: {}): Promise<implicitReturnType>;
    privateGetFetchOrder(params?: {}): Promise<implicitReturnType>;
    privateGetFetchTrades(params?: {}): Promise<implicitReturnType>;
    privatePostCreateOrder(params?: {}): Promise<implicitReturnType>;
    privatePostCancelOrder(params?: {}): Promise<implicitReturnType>;
    privatePostCancelAllOrders(params?: {}): Promise<implicitReturnType>;
}
declare abstract class Exchange extends _Exchange {
}
export default Exchange;
