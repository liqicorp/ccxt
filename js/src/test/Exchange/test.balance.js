// @ts-nocheck
// ----------------------------------------------------------------------------
import assert from 'assert';
// ----------------------------------------------------------------------------
export default (exchange, balance, method = undefined) => {
    const currencies = [
        'USD',
        'USDT',
        'CNY',
        'EUR',
        'BTC',
        'ETH',
        'JPY',
        'LTC',
        'DASH',
        'DOGE',
        'UAH',
        'RUB',
        'XRP',
    ];
    assert(typeof balance['total'] === 'object');
    assert(typeof balance['free'] === 'object');
    assert(typeof balance['used'] === 'object');
    const codes = Object.keys(balance['total']);
    for (let i = 0; i < codes.length; i++) {
        const code = codes[i];
        const total = balance['total'][code];
        const free = balance['free'][code];
        const used = balance['used'][code];
        if ((total !== undefined) && (free !== undefined) && (used !== undefined)) {
            assert(total === free + used, 'free and used do not sum to total ' + exchange.id);
        }
    }
};
