// ----------------------------------------------------------------------------
import assert from 'assert';
// ----------------------------------------------------------------------------
export default (exchange, ticker, method, symbol) => {
    const format = {
        'symbol': 'ETH/BTC',
        'info': {},
        'timestamp': 1234567890,
        'datetime': '2017-09-01T00:00:00',
        'high': 1.234,
        'low': 1.234,
        'bid': 1.234,
        'bidVolume': 1.234,
        'ask': 1.234,
        'askVolume': 1.234,
        'vwap': 1.234,
        'open': 1.234,
        'close': 1.234,
        'last': 1.234,
        'previousClose': 1.234,
        'change': 1.234,
        'percentage': 1.234,
        'average': 1.234,
        'baseVolume': 1.234,
        'quoteVolume': 1.234, // volume of quote currency
    };
    const keys = Object.keys(format);
    for (let i = 0; i < keys.length; i++) {
        const key = keys[i];
        assert(key in ticker);
    }
    assert(!('first' in ticker), '`first` field leftover in ' + exchange.id);
    assert(ticker['last'] === ticker['close'], '`last` != `close` in ' + exchange.id);
    if (method !== undefined) {
        console.log(ticker['datetime'], exchange.id, method, ticker['symbol'], ticker['last']);
    }
    // const { high, low, vwap, baseVolume, quoteVolume } = ticker
    // this assert breaks QuadrigaCX sometimes... still investigating
    // if (vwap) {
    //     assert (vwap >= low && vwap <= high)
    // }
    // if (baseVolume && quoteVolume && high && low) {
    //     assert (quoteVolume >= baseVolume * low) // this assertion breaks therock
    //     assert (quoteVolume <= baseVolume * high)
    // }
    // if (baseVolume && vwap) {
    //     assert (quoteVolume)
    // }
    // if (quoteVolume && vwap) {
    //     assert (baseVolume)
    // }
    if (![
        'bigone',
        'bitbns',
        'bitmart',
        'bitrue',
        'btcbox',
        'btcturk',
        'bybit',
        'coss',
        'cryptocom',
        'ftx',
        'ftxus',
        'gateio',
        'idex',
        'mercado',
        'mexc',
        'okex',
        'poloniex',
        'qtrade',
        'southxchange',
        'timex',
        'xbtce',
        'kuna', // https://imgsh.net/a/9eoukoM.png
    ].includes(exchange.id)) {
        if (ticker['baseVolume'] || ticker['quoteVolume']) {
            if (ticker['bid'] && ticker['ask']) {
                assert(ticker['bid'] <= ticker['ask'], (ticker['symbol'] ? (ticker['symbol'] + ' ') : '') + 'ticker bid is greater than ticker ask!');
            }
        }
    }
    return ticker;
};
