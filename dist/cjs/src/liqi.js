'use strict';

var elliptic = require('elliptic');
var liqi$1 = require('./abstract/liqi.js');
var errors = require('./base/errors.js');
var Precise = require('./base/Precise.js');
var number = require('./base/functions/number.js');
var sha256 = require('./static_dependencies/noble-hashes/sha256.js');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

var elliptic__default = /*#__PURE__*/_interopDefaultLegacy(elliptic);

/* eslint-disable no-bitwise */
//  ---------------------------------------------------------------------------
class liqi extends liqi$1 {
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
                    'System is under maintenance.': errors.OnMaintenance,
                    'System abnormality': errors.ExchangeError,
                    'You are not authorized to execute this request.': errors.PermissionDenied,
                    'API key does not exist': errors.AuthenticationError,
                    'Order would trigger immediately.': errors.OrderImmediatelyFillable,
                    'Stop price would trigger immediately.': errors.OrderImmediatelyFillable,
                    'Order would immediately match and take.': errors.OrderImmediatelyFillable,
                    'Account has insufficient balance for requested action.': errors.InsufficientFunds,
                    'Rest API trading is not enabled.': errors.ExchangeNotAvailable,
                    "You don't have permission.": errors.PermissionDenied,
                    'Market is closed.': errors.ExchangeNotAvailable,
                    'Too many requests. Please try again later.': errors.DDoSProtection,
                    'This action disabled is on this account.': errors.AccountSuspended,
                    '-1000': errors.ExchangeNotAvailable,
                    '-1001': errors.ExchangeNotAvailable,
                    '-1002': errors.AuthenticationError,
                    '-1003': errors.RateLimitExceeded,
                    '-1004': errors.DDoSProtection,
                    '-1005': errors.PermissionDenied,
                    '-1006': errors.BadResponse,
                    '-1007': errors.RequestTimeout,
                    '-1010': errors.BadResponse,
                    '-1011': errors.PermissionDenied,
                    '-1013': errors.InvalidOrder,
                    '-1014': errors.InvalidOrder,
                    '-1015': errors.RateLimitExceeded,
                    '-1016': errors.ExchangeNotAvailable,
                    '-1020': errors.BadRequest,
                    '-1021': errors.InvalidNonce,
                    '-1022': errors.AuthenticationError,
                    '-1023': errors.BadRequest,
                    '-1099': errors.AuthenticationError,
                    '-1100': errors.BadRequest,
                    '-1101': errors.BadRequest,
                    '-1102': errors.BadRequest,
                    '-1103': errors.BadRequest,
                    '-1104': errors.BadRequest,
                    '-1105': errors.BadRequest,
                    '-1106': errors.BadRequest,
                    '-1108': errors.BadRequest,
                    '-1109': errors.AuthenticationError,
                    '-1110': errors.BadRequest,
                    '-1111': errors.BadRequest,
                    '-1112': errors.InvalidOrder,
                    '-1113': errors.BadRequest,
                    '-1114': errors.BadRequest,
                    '-1115': errors.BadRequest,
                    '-1116': errors.BadRequest,
                    '-1117': errors.BadRequest,
                    '-1118': errors.BadRequest,
                    '-1119': errors.BadRequest,
                    '-1120': errors.BadRequest,
                    '-1121': errors.BadSymbol,
                    '-1125': errors.AuthenticationError,
                    '-1127': errors.BadRequest,
                    '-1128': errors.BadRequest,
                    '-1130': errors.BadRequest,
                    '-1131': errors.BadRequest,
                    '-1136': errors.BadRequest,
                    '-2008': errors.AuthenticationError,
                    '-2010': errors.ExchangeError,
                    '-2011': errors.OrderNotFound,
                    '-2013': errors.OrderNotFound,
                    '-2014': errors.AuthenticationError,
                    '-2015': errors.AuthenticationError,
                    '-2016': errors.BadRequest,
                    '-2018': errors.InsufficientFunds,
                    '-2019': errors.InsufficientFunds,
                    '-2020': errors.OrderNotFillable,
                    '-2021': errors.OrderImmediatelyFillable,
                    '-2022': errors.InvalidOrder,
                    '-2023': errors.InsufficientFunds,
                    '-2024': errors.InsufficientFunds,
                    '-2025': errors.InvalidOrder,
                    '-2026': errors.InvalidOrder,
                    '-2027': errors.InvalidOrder,
                    '-2028': errors.InsufficientFunds,
                    '-3000': errors.ExchangeError,
                    '-3001': errors.AuthenticationError,
                    '-3002': errors.BadSymbol,
                    '-3003': errors.BadRequest,
                    '-3004': errors.ExchangeError,
                    '-3005': errors.InsufficientFunds,
                    '-3006': errors.InsufficientFunds,
                    '-3007': errors.ExchangeError,
                    '-3008': errors.InsufficientFunds,
                    '-3009': errors.BadRequest,
                    '-3010': errors.ExchangeError,
                    '-3011': errors.BadRequest,
                    '-3012': errors.ExchangeError,
                    '-3013': errors.BadRequest,
                    '-3014': errors.AccountSuspended,
                    '-3015': errors.ExchangeError,
                    '-3016': errors.BadRequest,
                    '-3017': errors.ExchangeError,
                    '-3018': errors.AccountSuspended,
                    '-3019': errors.AccountSuspended,
                    '-3020': errors.InsufficientFunds,
                    '-3021': errors.BadRequest,
                    '-3022': errors.AccountSuspended,
                    '-3023': errors.BadRequest,
                    '-3024': errors.ExchangeError,
                    '-3025': errors.BadRequest,
                    '-3026': errors.BadRequest,
                    '-3027': errors.BadSymbol,
                    '-3028': errors.BadSymbol,
                    '-3029': errors.ExchangeError,
                    '-3036': errors.AccountSuspended,
                    '-3037': errors.ExchangeError,
                    '-3038': errors.BadRequest,
                    '-3041': errors.InsufficientFunds,
                    '-3042': errors.BadRequest,
                    '-3043': errors.BadRequest,
                    '-3044': errors.DDoSProtection,
                    '-3045': errors.ExchangeError,
                    '-3999': errors.ExchangeError,
                    '-4001': errors.BadRequest,
                    '-4002': errors.BadRequest,
                    '-4003': errors.BadRequest,
                    '-4004': errors.AuthenticationError,
                    '-4005': errors.RateLimitExceeded,
                    '-4006': errors.BadRequest,
                    '-4007': errors.BadRequest,
                    '-4008': errors.BadRequest,
                    '-4010': errors.BadRequest,
                    '-4011': errors.BadRequest,
                    '-4012': errors.BadRequest,
                    '-4013': errors.AuthenticationError,
                    '-4014': errors.PermissionDenied,
                    '-4015': errors.ExchangeError,
                    '-4016': errors.PermissionDenied,
                    '-4017': errors.PermissionDenied,
                    '-4018': errors.BadSymbol,
                    '-4019': errors.BadSymbol,
                    '-4021': errors.BadRequest,
                    '-4022': errors.BadRequest,
                    '-4023': errors.ExchangeError,
                    '-4024': errors.InsufficientFunds,
                    '-4025': errors.InsufficientFunds,
                    '-4026': errors.InsufficientFunds,
                    '-4027': errors.ExchangeError,
                    '-4028': errors.BadRequest,
                    '-4029': errors.BadRequest,
                    '-4030': errors.ExchangeError,
                    '-4031': errors.ExchangeError,
                    '-4032': errors.ExchangeError,
                    '-4033': errors.BadRequest,
                    '-4034': errors.ExchangeError,
                    '-4035': errors.PermissionDenied,
                    '-4036': errors.BadRequest,
                    '-4037': errors.ExchangeError,
                    '-4038': errors.ExchangeError,
                    '-4039': errors.BadRequest,
                    '-4040': errors.BadRequest,
                    '-4041': errors.ExchangeError,
                    '-4042': errors.ExchangeError,
                    '-4043': errors.BadRequest,
                    '-4044': errors.BadRequest,
                    '-4045': errors.ExchangeError,
                    '-4046': errors.AuthenticationError,
                    '-4047': errors.BadRequest,
                    '-5001': errors.BadRequest,
                    '-5002': errors.InsufficientFunds,
                    '-5003': errors.InsufficientFunds,
                    '-5004': errors.BadRequest,
                    '-5005': errors.InsufficientFunds,
                    '-5006': errors.BadRequest,
                    '-5007': errors.BadRequest,
                    '-5008': errors.InsufficientFunds,
                    '-5009': errors.BadRequest,
                    '-5010': errors.ExchangeError,
                    '-5011': errors.BadRequest,
                    '-5012': errors.ExchangeError,
                    '-5013': errors.InsufficientFunds,
                    '-5021': errors.BadRequest,
                    '-6001': errors.BadRequest,
                    '-6003': errors.BadRequest,
                    '-6004': errors.ExchangeError,
                    '-6005': errors.InvalidOrder,
                    '-6006': errors.BadRequest,
                    '-6007': errors.BadRequest,
                    '-6008': errors.BadRequest,
                    '-6009': errors.RateLimitExceeded,
                    '-6011': errors.BadRequest,
                    '-6012': errors.InsufficientFunds,
                    '-6013': errors.ExchangeError,
                    '-6014': errors.BadRequest,
                    '-6015': errors.BadRequest,
                    '-6016': errors.BadRequest,
                    '-6017': errors.BadRequest,
                    '-6018': errors.BadRequest,
                    '-6019': errors.AuthenticationError,
                    '-6020': errors.BadRequest,
                    '-7001': errors.BadRequest,
                    '-7002': errors.BadRequest,
                    '-10017': errors.BadRequest,
                    '-11008': errors.InsufficientFunds,
                    '-12014': errors.RateLimitExceeded,
                    '-13000': errors.BadRequest,
                    '-13001': errors.BadRequest,
                    '-13002': errors.BadRequest,
                    '-13003': errors.BadRequest,
                    '-13004': errors.BadRequest,
                    '-13005': errors.BadRequest,
                    '-13006': errors.InvalidOrder,
                    '-13007': errors.AuthenticationError,
                    '100001003': errors.BadRequest, // {"code":100001003,"msg":"Verification failed"} // undocumented
                },
                'broad': {
                    'has no operation privilege': errors.PermissionDenied,
                    'MAX_POSITION': errors.InvalidOrder, // {"code":-2010,"msg":"Filter failure: MAX_POSITION"}
                },
            },
        });
    }
    costToPrecision(symbol, cost) {
        return this.decimalToPrecision(cost, number.TRUNCATE, this.markets[symbol]['precision']['quote'], this.precisionMode, this.paddingMode);
    }
    currencyToPrecision(currency, fee) {
        // info is available in currencies only if the user has configured his api keys
        if (this.safeValue(this.currencies[currency], 'precision') !== undefined) {
            return this.decimalToPrecision(fee, number.TRUNCATE, this.currencies[currency]['precision'], this.precisionMode, this.paddingMode);
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
            throw new errors.ArgumentsRequired(' fetchOrder () precisa do id da ordem como parâmetro');
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
            throw new errors.ArgumentsRequired(' fetchOrders () precisa do symbol como parâmetro');
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
        const status = this.safeString(order, 'status');
        const symbol = this.safeString(order, 'symbol');
        const timestamp = this.safeInteger(order, 'timestamp');
        const price = this.safeFloat(order, 'price');
        const amount = this.safeFloat(order, 'amount');
        const filled = this.safeFloat(order, 'filled');
        const remaining = this.safeFloat(order, 'remaining');
        const cost = this.safeFloat(order, 'cost');
        const type = this.safeString(order, 'type');
        const side = this.safeString(order, 'side');
        const id = this.safeString(order, 'id');
        const average = this.safeFloat(order, 'average');
        const clientOrderId = this.safeString(order, 'clientOrderId');
        const timeInForce = this.safeString(order, 'timeInForce');
        const trades = this.safeValue(order, 'trades');
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
        const response = await this['privatePostCreateOrder'](this.extend(request, params));
        return response;
    }
    async fetchOpenOrders(symbol = undefined, since = undefined, limit = undefined, params = {}) {
        if (symbol === undefined) {
            throw new errors.ArgumentsRequired(' fetchOpenOrders () precisa do symbol como parâmetro');
        }
        const request = {
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
            throw new errors.ArgumentsRequired(this.id + ' cancelAllOrders () requires a symbol argument');
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
            throw new errors.ArgumentsRequired(this.id + ' fetchOrderTrades () requires a symbol argument');
        }
        await this.loadMarkets();
        const market = this.market(symbol);
        const type = this.safeString(params, 'type', market['type']);
        params = this.omit(params, 'type');
        if (type !== 'spot') {
            throw new errors.NotSupported(this.id + ' fetchOrderTrades () supports spot markets only');
        }
        const request = {
            'orderId': id,
        };
        return await this.fetchMyTrades(symbol, since, limit, this.extend(request, params));
    }
    signEddsa(message) {
        const hash = this.hash(message, sha256.sha256, 'hex');
        // const signature = eddsa (hash, this.secret, ed25519);
        // return signature;
        const EC = elliptic__default["default"].ec;
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
            throw new errors.DDoSProtection(this.id + ' ' + code.toString() + ' ' + reason + ' ' + body);
        }
        // error response in a form: { "code": -1013, "msg": "Invalid quantity." }
        // following block cointains legacy checks against message patterns in "msg" property
        // will switch "code" checks eventually, when we know all of them
        if (code >= 400) {
            if (body.indexOf('Price * QTY is zero or less') >= 0) {
                throw new errors.InvalidOrder(this.id
                    + ' order cost = amount * price is zero or less '
                    + body);
            }
            if (body.indexOf('LOT_SIZE') >= 0) {
                throw new errors.InvalidOrder(this.id
                    + ' order amount should be evenly divisible by lot size '
                    + body);
            }
            if (body.indexOf('PRICE_FILTER') >= 0) {
                throw new errors.InvalidOrder(this.id
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
            if (error === '200' || Precise["default"].stringEquals(error, '0')) {
                return undefined;
            }
            // a workaround for {"code":-2015,"msg":"Invalid API-key, IP, or permissions for action."}
            // despite that their message is very confusing, it is raised by Liqi
            // on a temporary ban, the API key is valid, but disabled for a while
            if (error === '-2015'
                && this.options['hasAlreadyAuthenticatedSuccessfully']) {
                throw new errors.DDoSProtection(this.id + ' temporary banned: ' + body);
            }
            const feedback = this.id + ' ' + body;
            if (message === 'No need to change margin type.') {
                // not an error
                // https://github.com/ccxt/ccxt/issues/11268
                // https://github.com/ccxt/ccxt/pull/11624
                // POST https://fapi.liqi.com.br/fapi/v1/marginType 400 Bad Request
                // liqiusdm {"code":-4046,"msg":"No need to change margin type."}
                throw new errors.MarginModeAlreadySet(feedback);
            }
            this.throwExactlyMatchedException(this.exceptions['exact'], error, feedback);
            throw new errors.ExchangeError(feedback);
        }
        if (!success) {
            throw new errors.ExchangeError(this.id + ' ' + body);
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

module.exports = liqi;
