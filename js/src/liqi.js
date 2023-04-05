/* eslint-disable no-bitwise */
//  ---------------------------------------------------------------------------
import elliptic from 'elliptic';
import Exchange from './abstract/liqi.js';
import { NotSupported, ExchangeError, BadRequest, InsufficientFunds, InvalidOrder, MarginModeAlreadySet, AccountSuspended, ArgumentsRequired, AuthenticationError, BadResponse, BadSymbol, DDoSProtection, ExchangeNotAvailable, InvalidNonce, OnMaintenance, OrderImmediatelyFillable, OrderNotFillable, OrderNotFound, PermissionDenied, RateLimitExceeded, RequestTimeout, } from './base/errors.js';
import { Precise } from './base/Precise.js';
import { TRUNCATE } from './base/functions/number.js';
import { sha256 } from './static_dependencies/noble-hashes/sha256.js';
//  ---------------------------------------------------------------------------
export default class liqi extends Exchange {
    describe() {
        return this.deepExtend(super.describe(), {
            'id': 'liqi',
            'name': 'Liqi',
            'countries': ['JP', 'MT'],
            'rateLimit': 50,
            'certified': true,
            'pro': true,
            'has': {
                'CORS': undefined,
                'spot': true,
                'margin': false,
                'swap': false,
                'future': false,
                'option': undefined,
                'addMargin': true,
                'cancelAllOrders': false,
                'cancelOrder': true,
                'cancelOrders': false,
                'createDepositAddress': false,
                'createOrder': true,
                'createReduceOnlyOrder': false,
                'deposit': false,
                'fetchAccounts': false,
                'fetchBalance': true,
                'fetchBidsAsks': false,
                'fetchBorrowRate': false,
                'fetchBorrowRateHistories': false,
                'fetchBorrowRateHistory': false,
                'fetchBorrowRates': false,
                'fetchBorrowRatesPerSymbol': false,
                'fetchCanceledOrders': false,
                'fetchClosedOrder': false,
                'fetchClosedOrders': true,
                'fetchCurrencies': true,
                'fetchDeposit': false,
                'fetchDepositAddress': false,
                'fetchDepositAddresses': false,
                'fetchDepositAddressesByNetwork': false,
                'fetchDeposits': false,
                'fetchFundingFee': false,
                'fetchFundingFees': false,
                'fetchFundingHistory': false,
                'fetchFundingRate': false,
                'fetchFundingRateHistory': false,
                'fetchFundingRates': false,
                'fetchIndexOHLCV': false,
                'fetchIsolatedPositions': false,
                'fetchL3OrderBook': false,
                'fetchLedger': false,
                'fetchLeverage': false,
                'fetchLeverageTiers': false,
                'fetchMarketLeverageTiers': 'emulated',
                'fetchMarkets': true,
                'fetchMarkOHLCV': false,
                'fetchMyBuys': false,
                'fetchMySells': false,
                'fetchMyTrades': true,
                'fetchOHLCV': true,
                'fetchOpenOrder': false,
                'fetchOpenOrders': true,
                'fetchOrder': true,
                'fetchOrderBook': true,
                'fetchOrderBooks': false,
                'fetchOrders': false,
                'fetchOrderTrades': false,
                'fetchPosition': false,
                'fetchPositions': false,
                'fetchPositionsRisk': false,
                'fetchPremiumIndexOHLCV': false,
                'fetchStatus': false,
                'fetchTicker': true,
                'fetchTickers': true,
                'fetchTime': false,
                'fetchTrades': false,
                'fetchTradingFee': false,
                'fetchTradingFees': false,
                'fetchTradingLimits': false,
                'fetchTransactions': false,
                'fetchTransfers': false,
                'fetchWithdrawal': false,
                'fetchWithdrawals': false,
                'fetchWithdrawalWhitelist': false,
                'reduceMargin': false,
                'setLeverage': false,
                'setMarginMode': false,
                'setPositionMode': false,
                'signIn': true,
                'transfer': false,
                'withdraw': false,
            },
            'timeframes': {
                '1m': '1m',
                '3m': '3m',
                '5m': '5m',
                '15m': '15m',
                '30m': '30m',
                '1h': '1h',
                '2h': '2h',
                '4h': '4h',
                '6h': '6h',
                '8h': '8h',
                '12h': '12h',
                '1d': '1d',
                '3d': '3d',
                '1w': '1w',
                '1M': '1M',
            },
            'urls': {
                'logo': '',
                'api': {
                    'public': 'https://api.liqi.com.br/exchange/v1',
                    'private': 'https://api.liqi.com.br/exchange/v1',
                },
                'www': 'https://www.liqi.com.br',
                'doc': ['https://liqi.readme.io/'],
                'api_management': 'https://www.liqi.com.br/gerenciamento-de-api',
            },
            'depth': 1,
            'api': {
                'public': {
                    'get': {
                        'fetchMarket': 1,
                        'fetchMarkets': 20,
                        'fetchCurrencies': 20,
                        'fetchTickers': 20,
                        'fetchTicker': 1,
                        'fetchOrderBook': 100,
                        'fetchOHLCV': 1000,
                    },
                },
                'private': {
                    'get': {
                        'fetchBalance': 1,
                        'fetchOrders': 100,
                        'fetchOpenOrders': 100,
                        'fetchOrder': 1,
                        'fetchTrades': 500,
                    },
                    'post': {
                        'createOrder': 1,
                        'cancelOrder': 1,
                        'cancelAllOrders': 1,
                    },
                },
            },
            'fees': {
                'trading': {
                    'feeSide': 'get',
                    'tierBased': false,
                    'percentage': true,
                    'taker': this.parseNumber('0.0035'),
                    'maker': this.parseNumber('0.0015'),
                },
                'option': {},
            },
            'commonCurrencies': {
                'BCC': 'BCC',
                'YOYO': 'YOYOW',
            },
            // exchange-specific options
            'options': {
                'fetchCurrencies': true,
                'defaultTimeInForce': 'GTC',
                'defaultType': 'spot',
                'hasAlreadyAuthenticatedSuccessfully': false,
                'warnOnFetchOpenOrdersWithoutSymbol': true,
                'throwMarginModeAlreadySet': false,
                'fetchPositions': 'positionRisk',
                'recvWindow': 5 * 1000,
                'timeDifference': 0,
                'adjustForTimeDifference': false,
                'newOrderRespType': {
                    'market': 'FULL',
                    'limit': 'FULL', // we change it from 'ACK' by default to 'FULL'  (returns immediately if limit is not hit)
                },
                'quoteOrderQty': true,
                'accountsByType': {
                    'main': 'MAIN',
                    'spot': 'MAIN',
                    'funding': 'FUNDING',
                    'margin': 'MARGIN',
                    'future': 'UMFUTURE',
                    'delivery': 'CMFUTURE',
                    'mining': 'MINING',
                },
                'typesByAccount': {
                    'MAIN': 'spot',
                    'FUNDING': 'funding',
                    'MARGIN': 'margin',
                    'UMFUTURE': 'future',
                    'CMFUTURE': 'delivery',
                    'MINING': 'mining',
                },
                'networks': {
                    'ERC20': 'ETH',
                    'TRC20': 'TRX',
                    'BEP2': 'BNB',
                    'BEP20': 'BSC',
                    'OMNI': 'OMNI',
                    'EOS': 'EOS',
                    'SPL': 'SOL',
                },
                'reverseNetworks': {
                    'tronscan.org': 'TRC20',
                    'etherscan.io': 'ERC20',
                    'bscscan.com': 'BSC',
                    'explorer.liqi.org': 'BEP2',
                    'bithomp.com': 'XRP',
                    'bloks.io': 'EOS',
                    'stellar.expert': 'XLM',
                    'blockchair.com/bitcoin': 'BTC',
                    'blockchair.com/bitcoin-cash': 'BCH',
                    'blockchair.com/ecash': 'XEC',
                    'explorer.litecoin.net': 'LTC',
                    'explorer.avax.network': 'AVAX',
                    'solscan.io': 'SOL',
                    'polkadot.subscan.io': 'DOT',
                    'dashboard.internetcomputer.org': 'ICP',
                    'explorer.chiliz.com': 'CHZ',
                    'cardanoscan.io': 'ADA',
                    'mainnet.theoan.com': 'AION',
                    'algoexplorer.io': 'ALGO',
                    'explorer.ambrosus.com': 'AMB',
                    'viewblock.io/zilliqa': 'ZIL',
                    'viewblock.io/arweave': 'AR',
                    'explorer.ark.io': 'ARK',
                    'atomscan.com': 'ATOM',
                    'www.mintscan.io': 'CTK',
                    'explorer.bitcoindiamond.org': 'BCD',
                    'btgexplorer.com': 'BTG',
                    'bts.ai': 'BTS',
                    'explorer.celo.org': 'CELO',
                    'explorer.nervos.org': 'CKB',
                    'cerebro.cortexlabs.ai': 'CTXC',
                    'chainz.cryptoid.info': 'VIA',
                    'explorer.dcrdata.org': 'DCR',
                    'digiexplorer.info': 'DGB',
                    'dock.subscan.io': 'DOCK',
                    'dogechain.info': 'DOGE',
                    'explorer.elrond.com': 'EGLD',
                    'blockscout.com': 'ETC',
                    'explore-fetchhub.fetch.ai': 'FET',
                    'filfox.info': 'FIL',
                    'fio.bloks.io': 'FIO',
                    'explorer.firo.org': 'FIRO',
                    'neoscan.io': 'NEO',
                    'ftmscan.com': 'FTM',
                    'explorer.gochain.io': 'GO',
                    'block.gxb.io': 'GXS',
                    'hash-hash.info': 'HBAR',
                    'www.hiveblockexplorer.com': 'HIVE',
                    'explorer.helium.com': 'HNT',
                    'tracker.icon.foundation': 'ICX',
                    'www.iostabc.com': 'IOST',
                    'explorer.iota.org': 'IOTA',
                    'iotexscan.io': 'IOTX',
                    'irishub.iobscan.io': 'IRIS',
                    'kava.mintscan.io': 'KAVA',
                    'scope.klaytn.com': 'KLAY',
                    'kmdexplorer.io': 'KMD',
                    'kusama.subscan.io': 'KSM',
                    'explorer.lto.network': 'LTO',
                    'polygonscan.com': 'POLYGON',
                    'explorer.ont.io': 'ONT',
                    'minaexplorer.com': 'MINA',
                    'nanolooker.com': 'NANO',
                    'explorer.nebulas.io': 'NAS',
                    'explorer.nbs.plus': 'NBS',
                    'explorer.nebl.io': 'NEBL',
                    'nulscan.io': 'NULS',
                    'nxscan.com': 'NXS',
                    'explorer.harmony.one': 'ONE',
                    'explorer.poa.network': 'POA',
                    'qtum.info': 'QTUM',
                    'explorer.rsk.co': 'RSK',
                    'www.oasisscan.com': 'ROSE',
                    'ravencoin.network': 'RVN',
                    'sc.tokenview.com': 'SC',
                    'secretnodes.com': 'SCRT',
                    'explorer.skycoin.com': 'SKY',
                    'steemscan.com': 'STEEM',
                    'explorer.stacks.co': 'STX',
                    'www.thetascan.io': 'THETA',
                    'scan.tomochain.com': 'TOMO',
                    'explore.vechain.org': 'VET',
                    'explorer.vite.net': 'VITE',
                    'www.wanscan.org': 'WAN',
                    'wavesexplorer.com': 'WAVES',
                    'wax.eosx.io': 'WAXP',
                    'waltonchain.pro': 'WTC',
                    'chain.nem.ninja': 'XEM',
                    'verge-blockchain.info': 'XVG',
                    'explorer.yoyow.org': 'YOYOW',
                    'explorer.zcha.in': 'ZEC',
                    'explorer.zensystem.io': 'ZEN',
                },
                'impliedNetworks': {
                    'ETH': { 'ERC20': 'ETH' },
                    'TRX': { 'TRC20': 'TRX' },
                },
                'legalMoney': {
                    'BRL': true,
                },
            },
            // https://liqi-docs.github.io/apidocs/spot/en/#error-codes-2
            'exceptions': {
                'exact': {
                    'System is under maintenance.': OnMaintenance,
                    'System abnormality': ExchangeError,
                    'You are not authorized to execute this request.': PermissionDenied,
                    'API key does not exist': AuthenticationError,
                    'Order would trigger immediately.': OrderImmediatelyFillable,
                    'Stop price would trigger immediately.': OrderImmediatelyFillable,
                    'Order would immediately match and take.': OrderImmediatelyFillable,
                    'Account has insufficient balance for requested action.': InsufficientFunds,
                    'Rest API trading is not enabled.': ExchangeNotAvailable,
                    "You don't have permission.": PermissionDenied,
                    'Market is closed.': ExchangeNotAvailable,
                    'Too many requests. Please try again later.': DDoSProtection,
                    'This action disabled is on this account.': AccountSuspended,
                    '-1000': ExchangeNotAvailable,
                    '-1001': ExchangeNotAvailable,
                    '-1002': AuthenticationError,
                    '-1003': RateLimitExceeded,
                    '-1004': DDoSProtection,
                    '-1005': PermissionDenied,
                    '-1006': BadResponse,
                    '-1007': RequestTimeout,
                    '-1010': BadResponse,
                    '-1011': PermissionDenied,
                    '-1013': InvalidOrder,
                    '-1014': InvalidOrder,
                    '-1015': RateLimitExceeded,
                    '-1016': ExchangeNotAvailable,
                    '-1020': BadRequest,
                    '-1021': InvalidNonce,
                    '-1022': AuthenticationError,
                    '-1023': BadRequest,
                    '-1099': AuthenticationError,
                    '-1100': BadRequest,
                    '-1101': BadRequest,
                    '-1102': BadRequest,
                    '-1103': BadRequest,
                    '-1104': BadRequest,
                    '-1105': BadRequest,
                    '-1106': BadRequest,
                    '-1108': BadRequest,
                    '-1109': AuthenticationError,
                    '-1110': BadRequest,
                    '-1111': BadRequest,
                    '-1112': InvalidOrder,
                    '-1113': BadRequest,
                    '-1114': BadRequest,
                    '-1115': BadRequest,
                    '-1116': BadRequest,
                    '-1117': BadRequest,
                    '-1118': BadRequest,
                    '-1119': BadRequest,
                    '-1120': BadRequest,
                    '-1121': BadSymbol,
                    '-1125': AuthenticationError,
                    '-1127': BadRequest,
                    '-1128': BadRequest,
                    '-1130': BadRequest,
                    '-1131': BadRequest,
                    '-1136': BadRequest,
                    '-2008': AuthenticationError,
                    '-2010': ExchangeError,
                    '-2011': OrderNotFound,
                    '-2013': OrderNotFound,
                    '-2014': AuthenticationError,
                    '-2015': AuthenticationError,
                    '-2016': BadRequest,
                    '-2018': InsufficientFunds,
                    '-2019': InsufficientFunds,
                    '-2020': OrderNotFillable,
                    '-2021': OrderImmediatelyFillable,
                    '-2022': InvalidOrder,
                    '-2023': InsufficientFunds,
                    '-2024': InsufficientFunds,
                    '-2025': InvalidOrder,
                    '-2026': InvalidOrder,
                    '-2027': InvalidOrder,
                    '-2028': InsufficientFunds,
                    '-3000': ExchangeError,
                    '-3001': AuthenticationError,
                    '-3002': BadSymbol,
                    '-3003': BadRequest,
                    '-3004': ExchangeError,
                    '-3005': InsufficientFunds,
                    '-3006': InsufficientFunds,
                    '-3007': ExchangeError,
                    '-3008': InsufficientFunds,
                    '-3009': BadRequest,
                    '-3010': ExchangeError,
                    '-3011': BadRequest,
                    '-3012': ExchangeError,
                    '-3013': BadRequest,
                    '-3014': AccountSuspended,
                    '-3015': ExchangeError,
                    '-3016': BadRequest,
                    '-3017': ExchangeError,
                    '-3018': AccountSuspended,
                    '-3019': AccountSuspended,
                    '-3020': InsufficientFunds,
                    '-3021': BadRequest,
                    '-3022': AccountSuspended,
                    '-3023': BadRequest,
                    '-3024': ExchangeError,
                    '-3025': BadRequest,
                    '-3026': BadRequest,
                    '-3027': BadSymbol,
                    '-3028': BadSymbol,
                    '-3029': ExchangeError,
                    '-3036': AccountSuspended,
                    '-3037': ExchangeError,
                    '-3038': BadRequest,
                    '-3041': InsufficientFunds,
                    '-3042': BadRequest,
                    '-3043': BadRequest,
                    '-3044': DDoSProtection,
                    '-3045': ExchangeError,
                    '-3999': ExchangeError,
                    '-4001': BadRequest,
                    '-4002': BadRequest,
                    '-4003': BadRequest,
                    '-4004': AuthenticationError,
                    '-4005': RateLimitExceeded,
                    '-4006': BadRequest,
                    '-4007': BadRequest,
                    '-4008': BadRequest,
                    '-4010': BadRequest,
                    '-4011': BadRequest,
                    '-4012': BadRequest,
                    '-4013': AuthenticationError,
                    '-4014': PermissionDenied,
                    '-4015': ExchangeError,
                    '-4016': PermissionDenied,
                    '-4017': PermissionDenied,
                    '-4018': BadSymbol,
                    '-4019': BadSymbol,
                    '-4021': BadRequest,
                    '-4022': BadRequest,
                    '-4023': ExchangeError,
                    '-4024': InsufficientFunds,
                    '-4025': InsufficientFunds,
                    '-4026': InsufficientFunds,
                    '-4027': ExchangeError,
                    '-4028': BadRequest,
                    '-4029': BadRequest,
                    '-4030': ExchangeError,
                    '-4031': ExchangeError,
                    '-4032': ExchangeError,
                    '-4033': BadRequest,
                    '-4034': ExchangeError,
                    '-4035': PermissionDenied,
                    '-4036': BadRequest,
                    '-4037': ExchangeError,
                    '-4038': ExchangeError,
                    '-4039': BadRequest,
                    '-4040': BadRequest,
                    '-4041': ExchangeError,
                    '-4042': ExchangeError,
                    '-4043': BadRequest,
                    '-4044': BadRequest,
                    '-4045': ExchangeError,
                    '-4046': AuthenticationError,
                    '-4047': BadRequest,
                    '-5001': BadRequest,
                    '-5002': InsufficientFunds,
                    '-5003': InsufficientFunds,
                    '-5004': BadRequest,
                    '-5005': InsufficientFunds,
                    '-5006': BadRequest,
                    '-5007': BadRequest,
                    '-5008': InsufficientFunds,
                    '-5009': BadRequest,
                    '-5010': ExchangeError,
                    '-5011': BadRequest,
                    '-5012': ExchangeError,
                    '-5013': InsufficientFunds,
                    '-5021': BadRequest,
                    '-6001': BadRequest,
                    '-6003': BadRequest,
                    '-6004': ExchangeError,
                    '-6005': InvalidOrder,
                    '-6006': BadRequest,
                    '-6007': BadRequest,
                    '-6008': BadRequest,
                    '-6009': RateLimitExceeded,
                    '-6011': BadRequest,
                    '-6012': InsufficientFunds,
                    '-6013': ExchangeError,
                    '-6014': BadRequest,
                    '-6015': BadRequest,
                    '-6016': BadRequest,
                    '-6017': BadRequest,
                    '-6018': BadRequest,
                    '-6019': AuthenticationError,
                    '-6020': BadRequest,
                    '-7001': BadRequest,
                    '-7002': BadRequest,
                    '-10017': BadRequest,
                    '-11008': InsufficientFunds,
                    '-12014': RateLimitExceeded,
                    '-13000': BadRequest,
                    '-13001': BadRequest,
                    '-13002': BadRequest,
                    '-13003': BadRequest,
                    '-13004': BadRequest,
                    '-13005': BadRequest,
                    '-13006': InvalidOrder,
                    '-13007': AuthenticationError,
                    '100001003': BadRequest, // {"code":100001003,"msg":"Verification failed"} // undocumented
                },
                'broad': {
                    'has no operation privilege': PermissionDenied,
                    'MAX_POSITION': InvalidOrder, // {"code":-2010,"msg":"Filter failure: MAX_POSITION"}
                },
            },
        });
    }
    costToPrecision(symbol, cost) {
        return this.decimalToPrecision(cost, TRUNCATE, this.markets[symbol]['precision']['quote'], this.precisionMode, this.paddingMode);
    }
    currencyToPrecision(currency, fee) {
        // info is available in currencies only if the user has configured his api keys
        if (this.safeValue(this.currencies[currency], 'precision') !== undefined) {
            return this.decimalToPrecision(fee, TRUNCATE, this.currencies[currency]['precision'], this.precisionMode, this.paddingMode);
        }
        else {
            return this.numberToString(fee);
        }
    }
    nonce() {
        return this.milliseconds() - this.options['timeDifference'];
    }
    async fetchTime(params = {}) {
        const defaultType = this.safeString2(this.options, 'fetchTime', 'defaultType', 'spot');
        const type = this.safeString(params, 'type', defaultType);
        const query = this.omit(params, 'type');
        let method = 'publicGetTime';
        if (type === 'future') {
            method = 'fapiPublicGetTime';
        }
        else if (type === 'delivery') {
            method = 'dapiPublicGetTime';
        }
        const response = await this[method](query);
        return this.safeInteger(response, 'serverTime');
    }
    async fetchCurrencies(limit, params = {}) {
        const request = {
            'limit': limit || 1000,
        };
        const method = 'publicGetFetchCurrencies';
        const response = await this[method](this.extend(request, params));
        return response;
    }
    async fetchMarket(symbol, params = {}) {
        const request = {
            'symbol': symbol,
        };
        const method = 'publicGetFetchMarket';
        const response = await this[method](this.extend(request, params));
        return response;
    }
    async fetchMarkets(params = {}) {
        const method = 'publicGetFetchMarkets';
        const response = await this[method]();
        return response;
    }
    async fetchOrder(id, params = {}) {
        if (id === undefined) {
            throw new ArgumentsRequired(' fetchOrder () precisa do id da ordem como parâmetro');
        }
        const request = {
            'id': id,
        };
        const method = 'privateGetFetchOrder';
        let response = await this[method](this.extend(request));
        response = this.parseOrder(response);
        return response;
    }
    async fetchOrders(symbol, limit, since = undefined, params = {}) {
        if (symbol === undefined) {
            throw new ArgumentsRequired(' fetchOrders () precisa do symbol como parâmetro');
        }
        const request = {
            'symbol': symbol,
            'limit': limit || 50,
        };
        const method = 'privateGetFetchOrders';
        const response = await this[method](this.extend(request, params));
        for (let i = 0; i < response.length; i++) {
            response[i] = this.parseOrder(response[i]);
        }
        return response;
    }
    parseOrder(order) {
        const status = this.safeString(order, 'status', 'open');
        const symbol = this.safeString(order, 'symbol');
        const timestamp = this.safeInteger(order, 'timestamp', 0);
        const price = this.safeFloat(order, 'price', 0);
        const amount = this.safeFloat(order, 'amount', 0);
        const filled = this.safeFloat(order, 'filled', 0);
        const remaining = this.safeFloat(order, 'remaining', 0);
        const cost = this.safeFloat(order, 'cost', 0);
        const type = this.safeString(order, 'type', '');
        const side = this.safeString(order, 'side', '');
        const id = this.safeString(order, 'id');
        const average = this.safeFloat(order, 'average', 0);
        const clientOrderId = this.safeString(order, 'clientOrderId', '');
        const timeInForce = this.safeString(order, 'timeInForce', '');
        const trades = this.safeValue(order, 'trades', []);
        return {
            'info': order,
            'id': id,
            'clientOrderId': clientOrderId,
            'timestamp': timestamp,
            'datetime': this.iso8601(timestamp),
            'lastTradeTimestamp': undefined,
            'symbol': symbol,
            'type': type,
            'timeInForce': timeInForce,
            'side': side,
            'price': price,
            'cost': cost,
            'average': average,
            'amount': amount,
            'filled': filled,
            'remaining': remaining,
            'status': status,
            'fee': undefined,
            'trades': trades,
        };
    }
    async fetchBalance(params = {}) {
        const method = 'privateGetFetchBalance';
        const response = await this[method]();
        return response;
    }
    async fetchOrderBook(symbol, limit = undefined, params = {}) {
        const request = {
            'symbol': symbol,
        };
        const method = 'publicGetFetchOrderBook';
        const response = await this[method](this.extend(request, params));
        return response;
    }
    async fetchTicker(symbol, params = {}) {
        const request = {
            'symbol': symbol,
        };
        const method = 'publicGetFetchTicker';
        let response = await this[method](this.extend(request, params));
        response = this.parseTicker(response);
        return response;
    }
    async fetchTickers(limit, params = {}) {
        const request = {
            'limit': limit || 1000,
        };
        const method = 'publicGetFetchTickers';
        const response = await this[method](this.extend(request, params));
        for (let index = 0; index < response.length; index++) {
            response[index] = this.parseTicker(response[index]);
        }
        return response;
    }
    parseTicker(ticker) {
        ticker.timestamp = this.safeInteger(ticker.timestamp, 0);
        ticker.ask = this.safeFloat(ticker.ask, 8);
        ticker.bid = this.safeFloat(ticker.bid, 8);
        ticker.open = this.safeFloat(ticker.open, 8);
        ticker.close = this.safeFloat(ticker.close, 8);
        ticker.high = this.safeFloat(ticker.high, 8);
        ticker.low = this.safeFloat(ticker.low, 8);
        ticker.average = this.safeFloat(ticker.average, 8);
        ticker.change = this.safeFloat(ticker.change, 8);
        ticker.last = this.safeFloat(ticker.last, 8);
        ticker.askVolume = this.safeFloat(ticker.askVolume, 8);
        ticker.bidVolume = this.safeFloat(ticker.bidVolume, 8);
        ticker.baseVolume = this.safeFloat(ticker.baseVolume, 8);
        ticker.quoteVolume = this.safeFloat(ticker.quoteVolume, 8);
        return ticker;
    }
    async fetchOHLCV(symbol, internal = '1m', limit = 500, params = {}) {
        const request = {
            'symbol': symbol,
            'interval': internal,
            'limit': limit,
        };
        const method = 'publicGetFetchOHLCV';
        const response = await this[method](this.extend(request, params));
        return response;
    }
    async fetchTrades(symbol, limit = undefined, params = {}) {
        const request = {
            'symbol': symbol,
            'limit': limit,
        };
        const method = 'privateGetFetchTrades';
        const response = await this[method](this.extend(request, params));
        return response;
    }
    async createOrder(symbol, type, side, amount = undefined, price = undefined, quoteAmount = undefined, params = {}) {
        const request = {
            'symbol': symbol,
            'type': type,
            'side': side,
            'amount': amount,
            'price': price,
            'quoteAmount': quoteAmount,
        };
        const method = 'privatePostCreateOrder';
        const response = await this[method](this.extend(request, params));
        return this.parseOrder(response);
    }
    async fetchOpenOrders(symbol = undefined, since = undefined, limit = undefined, params = {}) {
        if (symbol === undefined) {
            throw new ArgumentsRequired(' fetchOpenOrders () precisa do symbol como parâmetro');
        }
        const request = {
            'since': since,
            'symbol': symbol,
            'limit': limit || 50,
        };
        const method = 'privateGetFetchOpenOrders';
        const response = await this[method](this.extend(request, params));
        return response;
    }
    async fetchClosedOrders(symbol = undefined, since = undefined, limit = undefined, params = {}) {
        const orders = await this.fetchOrders(symbol, since, limit, params);
        return this.filterBy(orders, 'status', 'closed');
    }
    async cancelOrder(id, params = {}) {
        const request = {
            'id': id,
        };
        const method = 'privatePostCancelOrder';
        const response = await this[method](this.extend(request, params));
        return response;
    }
    async cancelAllOrders(symbol = undefined, params = {}) {
        if (symbol === undefined) {
            throw new ArgumentsRequired(this.id + ' cancelAllOrders () requires a symbol argument');
        }
        const request = {
            'symbol': symbol,
        };
        const method = 'privatePostCancelAllOrders';
        const response = await this[method](this.extend(request, params));
        return response;
    }
    async fetchOrderTrades(id, symbol = undefined, since = undefined, limit = undefined, params = {}) {
        if (symbol === undefined) {
            throw new ArgumentsRequired(this.id + ' fetchOrderTrades () requires a symbol argument');
        }
        await this.loadMarkets();
        const market = this.market(symbol);
        const type = this.safeString(params, 'type', market['type']);
        params = this.omit(params, 'type');
        if (type !== 'spot') {
            throw new NotSupported(this.id + ' fetchOrderTrades () supports spot markets only');
        }
        const request = {
            'orderId': id,
        };
        return await this.fetchMyTrades(symbol, since, limit, this.extend(request, params));
    }
    signEddsa(message) {
        const hash = this.hash(message, sha256, 'hex');
        // const signature = eddsa (hash, this.secret, ed25519);
        // return signature;
        const EC = elliptic.ec;
        const algorithm = new EC('ed25519');
        const clientFromPriv = algorithm.keyFromPrivate('0130e25b9f324bc46ce2201edf6240574b2b87ef0acbb09f5534761d0c890bc4', 'hex');
        const clientSignature = clientFromPriv.sign(hash).toDER('hex');
        return clientSignature;
    }
    sign(path, api = 'public', method = 'GET', params = {}, headers = undefined, body = undefined) {
        let url = this.urls['api'][api] + '/' + this.implodeParams(path, params);
        headers = headers || {};
        if (api === 'private') {
            this.checkRequiredCredentials();
            let query = undefined;
            const recvWindow = this.safeInteger(this.options, 'recvWindow', 5000);
            const nonce = this.nonce();
            const extendedParams = this.extend({
                'timestamp': nonce,
                'recvWindow': recvWindow,
            }, params);
            query = this.urlencode(extendedParams);
            const signature = this.signEddsa(query);
            headers = {
                'signature': signature,
                'X-MBX-APIKEY': this.apiKey,
            };
            if (method === 'GET' || method === 'DELETE') {
                url += '?' + query;
            }
            else {
                body = query;
                headers['Content-Type'] = 'application/x-www-form-urlencoded';
            }
        }
        else {
            if (Object.keys(params).length) {
                url += '?' + this.urlencode(params);
            }
        }
        return { 'url': url, 'method': method, 'body': body, 'headers': headers };
    }
    handleErrors(code, reason, url, method, headers, body, response, requestHeaders, requestBody) {
        if (code === 418 || code === 429) {
            throw new DDoSProtection(this.id + ' ' + code.toString() + ' ' + reason + ' ' + body);
        }
        // error response in a form: { "code": -1013, "msg": "Invalid quantity." }
        // following block cointains legacy checks against message patterns in "msg" property
        // will switch "code" checks eventually, when we know all of them
        if (code >= 400) {
            if (body.indexOf('Price * QTY is zero or less') >= 0) {
                throw new InvalidOrder(this.id
                    + ' order cost = amount * price is zero or less '
                    + body);
            }
            if (body.indexOf('LOT_SIZE') >= 0) {
                throw new InvalidOrder(this.id
                    + ' order amount should be evenly divisible by lot size '
                    + body);
            }
            if (body.indexOf('PRICE_FILTER') >= 0) {
                throw new InvalidOrder(this.id
                    + ' order price is invalid, i.e. exceeds allowed price precision, exceeds min price or max price limits or is invalid value in general, use this.priceToPrecision  (symbol, amount) '
                    + body);
            }
        }
        if (response === undefined) {
            return; // fallback to default error handler
        }
        // check success value for wapi endpoints
        // response in format {'msg': 'The coin does not exist.', 'success': true/false}
        const success = this.safeValue(response, 'success', true);
        if (!success) {
            const message = this.safeString(response, 'msg');
            let parsedMessage = undefined;
            if (message !== undefined) {
                try {
                    parsedMessage = JSON.parse(message);
                }
                catch (e) {
                    // do nothing
                    parsedMessage = undefined;
                }
                if (parsedMessage !== undefined) {
                    response = parsedMessage;
                }
            }
        }
        const message = this.safeString(response, 'msg');
        if (message !== undefined) {
            this.throwExactlyMatchedException(this.exceptions['exact'], message, this.id + ' ' + message);
            this.throwBroadlyMatchedException(this.exceptions['broad'], message, this.id + ' ' + message);
        }
        // checks against error codes
        const error = this.safeString(response, 'code');
        if (error !== undefined) {
            // https://github.com/ccxt/ccxt/issues/6501
            // https://github.com/ccxt/ccxt/issues/7742
            if (error === '200' || Precise.stringEquals(error, '0')) {
                return undefined;
            }
            // a workaround for {"code":-2015,"msg":"Invalid API-key, IP, or permissions for action."}
            // despite that their message is very confusing, it is raised by Liqi
            // on a temporary ban, the API key is valid, but disabled for a while
            if (error === '-2015'
                && this.options['hasAlreadyAuthenticatedSuccessfully']) {
                throw new DDoSProtection(this.id + ' temporary banned: ' + body);
            }
            const feedback = this.id + ' ' + body;
            if (message === 'No need to change margin type.') {
                // not an error
                // https://github.com/ccxt/ccxt/issues/11268
                // https://github.com/ccxt/ccxt/pull/11624
                // POST https://fapi.liqi.com.br/fapi/v1/marginType 400 Bad Request
                // liqiusdm {"code":-4046,"msg":"No need to change margin type."}
                throw new MarginModeAlreadySet(feedback);
            }
            this.throwExactlyMatchedException(this.exceptions['exact'], error, feedback);
            throw new ExchangeError(feedback);
        }
        if (!success) {
            throw new ExchangeError(this.id + ' ' + body);
        }
    }
    async request(path, api = 'public', method = 'GET', params = {}, headers = undefined, body = undefined, config = {}, context = {}) {
        const response = await this.fetch2(path, api, method, params, headers, body, config, context);
        // a workaround for {"code":-2015,"msg":"Invalid API-key, IP, or permissions for action."}
        if (api === 'private' || api === 'wapi') {
            this.options['hasAlreadyAuthenticatedSuccessfully'] = true;
        }
        return response;
    }
}
