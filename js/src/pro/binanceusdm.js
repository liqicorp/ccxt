//  ---------------------------------------------------------------------------
import binance from './binance.js';
import { InvalidOrder } from '../base/errors.js';
// ---------------------------------------------------------------------------
export default class binanceusdm extends binance {
    describe() {
        return this.deepExtend(super.describe(), {
            'id': 'binanceusdm',
            'name': 'Binance USDⓈ-M',
            'urls': {
                'logo': 'https://user-images.githubusercontent.com/1294454/117738721-668c8d80-b205-11eb-8c49-3fad84c4a07f.jpg',
            },
            'options': {
                'fetchMarkets': ['linear'],
                'defaultSubType': 'linear',
            },
            // https://binance-docs.github.io/apidocs/futures/en/#error-codes
            'exceptions': {
                'exact': {
                    '-5021': InvalidOrder,
                    '-5022': InvalidOrder,
                    '-5028': InvalidOrder, // {"code":-5028,"msg":"Timestamp for this request is outside of the ME recvWindow."}
                },
            },
        });
    }
}
