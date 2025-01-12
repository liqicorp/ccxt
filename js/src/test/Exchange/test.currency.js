// ----------------------------------------------------------------------------
import assert from 'assert';
// ----------------------------------------------------------------------------
export default (exchange, currency, method) => {
    const format = {
        'id': 'btc',
        'code': 'BTC', // uppercase string literal of a pair of currencies
        //----------------------------------------------------------------------
        // commented temporarily to bring currencies to consistency first
        // 'name': 'Bitcoin', // uppercase string, base currency, 3 or more letters
        // 'quote': 'USD', // uppercase string, quote currency, 3 or more letters
        // 'withdraw': true, // can withdraw
        // 'deposit': true, // can deposit
        // 'active': true, // can both withdraw & deposit
        // 'precision': 8, // number of decimal digits "after the dot"
        // 'limits': { // value limits when placing orders on this market
        //     'amount': {
        //         'min': 0.01, // order amount should be > min
        //         'max': 1000, // order amount should be < max
        //     },
        //     'price': {
        //         'min': 0.01, // order price should be > min
        //         'max': 1000, // order price should be < max
        //     },
        //     'cost':  { // order cost = price * amount
        //         'min': 0.01, // order cost should be > min
        //         'max': 1000, // order cost should be < max
        //     },
        // },
        // 'info': {}, // the original unparsed market info from the exchange
        //----------------------------------------------------------------------
    };
    const keys = Object.keys(format);
    for (let i = 0; i < keys.length; i++) {
        const key = keys[i];
        assert(key in currency);
    }
    // expect (currency['precision']).to.not.be.undefined
    // expect (currency['limits']['amount']['min']).to.not.be.undefined
    // expect (currency['limits']['price']['min']).to.not.be.undefined
    // expect (market['limits']['cost']['min']).to.not.be.undefined
    return currency;
};
