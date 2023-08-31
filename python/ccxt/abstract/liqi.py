from ccxt.base.types import Entry


class ImplicitAPI:
    public_get_fetchmarket = publicGetFetchMarket = Entry('fetchMarket', 'public', 'GET', {'cost': 1})
    public_get_fetchmarkets = publicGetFetchMarkets = Entry('fetchMarkets', 'public', 'GET', {'cost': 20})
    public_get_fetchcurrencies = publicGetFetchCurrencies = Entry('fetchCurrencies', 'public', 'GET', {'cost': 20})
    public_get_fetchtickers = publicGetFetchTickers = Entry('fetchTickers', 'public', 'GET', {'cost': 20})
    public_get_fetchticker = publicGetFetchTicker = Entry('fetchTicker', 'public', 'GET', {'cost': 1})
    public_get_fetchorderbook = publicGetFetchOrderBook = Entry('fetchOrderBook', 'public', 'GET', {'cost': 100})
    public_get_fetchohlcv = publicGetFetchOHLCV = Entry('fetchOHLCV', 'public', 'GET', {'cost': 1000})
    private_get_fetchbalance = privateGetFetchBalance = Entry('fetchBalance', 'private', 'GET', {'cost': 1})
    private_get_fetchmyorders = privateGetFetchMyOrders = Entry('fetchMyOrders', 'private', 'GET', {'cost': 100})
    private_get_fetchorders = privateGetFetchOrders = Entry('fetchOrders', 'private', 'GET', {'cost': 100})
    private_get_fetchclosedorders = privateGetFetchClosedOrders = Entry('fetchClosedOrders', 'private', 'GET', {'cost': 1000})
    private_get_fetchopenorders = privateGetFetchOpenOrders = Entry('fetchOpenOrders', 'private', 'GET', {'cost': 100})
    private_get_fetchorder = privateGetFetchOrder = Entry('fetchOrder', 'private', 'GET', {'cost': 1})
    private_get_fetchtrades = privateGetFetchTrades = Entry('fetchTrades', 'private', 'GET', {'cost': 500})
    private_post_createorder = privatePostCreateOrder = Entry('createOrder', 'private', 'POST', {'cost': 1})
    private_post_cancelorder = privatePostCancelOrder = Entry('cancelOrder', 'private', 'POST', {'cost': 1})
    private_post_cancelallorders = privatePostCancelAllOrders = Entry('cancelAllOrders', 'private', 'POST', {'cost': 1})
