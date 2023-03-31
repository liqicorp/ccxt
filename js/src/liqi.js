'use strict';

//  ---------------------------------------------------------------------------

const Exchange = require('./base/Exchange');
const { ExchangeError, ArgumentsRequired, ExchangeNotAvailable, InsufficientFunds, OrderNotFound, InvalidOrder, DDoSProtection, InvalidNonce, AuthenticationError, RateLimitExceeded, PermissionDenied, NotSupported, BadRequest, BadSymbol, AccountSuspended, OrderImmediatelyFillable, OnMaintenance, BadResponse, RequestTimeout, OrderNotFillable, MarginModeAlreadySet } = require('./base/errors');
const { TRUNCATE } = require('./base/functions/number');
const Precise = require('./base/Precise');
const elliptic = require('./static_dependencies/elliptic/lib/elliptic')
var utils = require('./static_dependencies/elliptic/lib/elliptic/utils');
const EC = elliptic.ec

//  ---------------------------------------------------------------------------

module.exports = class liqi extends Exchange {
    describe() {
        return this.deepExtend(super.describe(), {
            'id': 'liqi',
            'name': 'Liqi',
            'countries': ['JP', 'MT'], // Japan, Malta
            'rateLimit': 50,
            'certified': true,
            'pro': true,
            'has': {
                'CORS': undefined,
                'spot': true,
                'margin': true,
                'swap': true,
                'future': true,
                'option': undefined,
                'addMargin': true,
                'cancelAllOrders': true,
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
                'doc': [
                    'https://liqi.readme.io/',
                ],
                'api_management': 'https://www.liqi.com.br/gerenciamento-de-api'
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
                        'fetchOHLCV': 1000
                    },
                },
                'private': {
                    'get': {
                        'fetchBalance': 1,
                        'fetchOrders': 100,
                        'fetchOpenOrders': 100,
                        'fetchOrder': 1,
                        'fetchTrades': 500
                    },
                    'post': {
                        'createOrder': 1,
                        'cancelOrder': 1,
                        'cancelAllOrders': 1
                    }
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
                'BCC': 'BCC', // kept for backward-compatibility https://github.com/ccxt/ccxt/issues/4848
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
                'recvWindow': 5 * 1000, // 5 sec, liqi default
                'timeDifference': 0, // the difference between system clock and Liqi clock
                'adjustForTimeDifference': false, // controls the adjustment logic upon instantiation
                'newOrderRespType': {
                    'market': 'FULL', // 'ACK' for order id, 'RESULT' for full order or 'FULL' for order with fills
                    'limit': 'FULL', // we change it from 'ACK' by default to 'FULL' (returns immediately if limit is not hit)
                },
                'quoteOrderQty': true, // whether market orders support amounts in quote currency
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
                    'MXN': true,
                    'UGX': true,
                    'SEK': true,
                    'CHF': true,
                    'VND': true,
                    'AED': true,
                    'DKK': true,
                    'KZT': true,
                    'HUF': true,
                    'PEN': true,
                    'PHP': true,
                    'USD': true,
                    'TRY': true,
                    'EUR': true,
                    'NGN': true,
                    'PLN': true,
                    'BRL': true,
                    'ZAR': true,
                    'KES': true,
                    'ARS': true,
                    'RUB': true,
                    'AUD': true,
                    'NOK': true,
                    'CZK': true,
                    'GBP': true,
                    'UAH': true,
                    'GHS': true,
                    'HKD': true,
                    'CAD': true,
                    'INR': true,
                    'JPY': true,
                    'NZD': true,
                },
            },
            // https://liqi-docs.github.io/apidocs/spot/en/#error-codes-2
            'exceptions': {
                'exact': {
                    'System is under maintenance.': OnMaintenance, // {"code":1,"msg":"System is under maintenance."}
                    'System abnormality': ExchangeError, // {"code":-1000,"msg":"System abnormality"}
                    'You are not authorized to execute this request.': PermissionDenied, // {"msg":"You are not authorized to execute this request."}
                    'API key does not exist': AuthenticationError,
                    'Order would trigger immediately.': OrderImmediatelyFillable,
                    'Stop price would trigger immediately.': OrderImmediatelyFillable, // {"code":-2010,"msg":"Stop price would trigger immediately."}
                    'Order would immediately match and take.': OrderImmediatelyFillable, // {"code":-2010,"msg":"Order would immediately match and take."}
                    'Account has insufficient balance for requested action.': InsufficientFunds,
                    'Rest API trading is not enabled.': ExchangeNotAvailable,
                    "You don't have permission.": PermissionDenied, // {"msg":"You don't have permission.","success":false}
                    'Market is closed.': ExchangeNotAvailable, // {"code":-1013,"msg":"Market is closed."}
                    'Too many requests. Please try again later.': DDoSProtection, // {"msg":"Too many requests. Please try again later.","success":false}
                    'This action disabled is on this account.': AccountSuspended, // {"code":-2010,"msg":"This action disabled is on this account."}
                    '-1000': ExchangeNotAvailable, // {"code":-1000,"msg":"An unknown error occured while processing the request."}
                    '-1001': ExchangeNotAvailable, // {"code":-1001,"msg":"'Internal error; unable to process your request. Please try again.'"}
                    '-1002': AuthenticationError, // {"code":-1002,"msg":"'You are not authorized to execute this request.'"}
                    '-1003': RateLimitExceeded, // {"code":-1003,"msg":"Too much request weight used, current limit is 1200 request weight per 1 MINUTE. Please use the websocket for live updates to avoid polling the API."}
                    '-1004': DDoSProtection, // {"code":-1004,"msg":"Server is busy, please wait and try again"}
                    '-1005': PermissionDenied, // {"code":-1005,"msg":"No such IP has been white listed"}
                    '-1006': BadResponse, // {"code":-1006,"msg":"An unexpected response was received from the message bus. Execution status unknown."}
                    '-1007': RequestTimeout, // {"code":-1007,"msg":"Timeout waiting for response from backend server. Send status unknown; execution status unknown."}
                    '-1010': BadResponse, // {"code":-1010,"msg":"ERROR_MSG_RECEIVED."}
                    '-1011': PermissionDenied, // {"code":-1011,"msg":"This IP cannot access this route."}
                    '-1013': InvalidOrder, // {"code":-1013,"msg":"createOrder -> 'invalid quantity'/'invalid price'/MIN_NOTIONAL"}
                    '-1014': InvalidOrder, // {"code":-1014,"msg":"Unsupported order combination."}
                    '-1015': RateLimitExceeded, // {"code":-1015,"msg":"'Too many new orders; current limit is %s orders per %s.'"}
                    '-1016': ExchangeNotAvailable, // {"code":-1016,"msg":"'This service is no longer available.',"}
                    '-1020': BadRequest, // {"code":-1020,"msg":"'This operation is not supported.'"}
                    '-1021': InvalidNonce, // {"code":-1021,"msg":"'your time is ahead of server'"}
                    '-1022': AuthenticationError, // {"code":-1022,"msg":"Signature for this request is not valid."}
                    '-1023': BadRequest, // {"code":-1023,"msg":"Start time is greater than end time."}
                    '-1099': AuthenticationError, // {"code":-1099,"msg":"Not found, authenticated, or authorized"}
                    '-1100': BadRequest, // {"code":-1100,"msg":"createOrder(symbol, 1, asdf) -> 'Illegal characters found in parameter 'price'"}
                    '-1101': BadRequest, // {"code":-1101,"msg":"Too many parameters; expected %s and received %s."}
                    '-1102': BadRequest, // {"code":-1102,"msg":"Param %s or %s must be sent, but both were empty"}
                    '-1103': BadRequest, // {"code":-1103,"msg":"An unknown parameter was sent."}
                    '-1104': BadRequest, // {"code":-1104,"msg":"Not all sent parameters were read, read 8 parameters but was sent 9"}
                    '-1105': BadRequest, // {"code":-1105,"msg":"Parameter %s was empty."}
                    '-1106': BadRequest, // {"code":-1106,"msg":"Parameter %s sent when not required."}
                    '-1108': BadRequest, // {"code":-1108,"msg":"Invalid asset."}
                    '-1109': AuthenticationError, // {"code":-1109,"msg":"Invalid account."}
                    '-1110': BadRequest, // {"code":-1110,"msg":"Invalid symbolType."}
                    '-1111': BadRequest, // {"code":-1111,"msg":"Precision is over the maximum defined for this asset."}
                    '-1112': InvalidOrder, // {"code":-1112,"msg":"No orders on book for symbol."}
                    '-1113': BadRequest, // {"code":-1113,"msg":"Withdrawal amount must be negative."}
                    '-1114': BadRequest, // {"code":-1114,"msg":"TimeInForce parameter sent when not required."}
                    '-1115': BadRequest, // {"code":-1115,"msg":"Invalid timeInForce."}
                    '-1116': BadRequest, // {"code":-1116,"msg":"Invalid orderType."}
                    '-1117': BadRequest, // {"code":-1117,"msg":"Invalid side."}
                    '-1118': BadRequest, // {"code":-1118,"msg":"New client order ID was empty."}
                    '-1119': BadRequest, // {"code":-1119,"msg":"Original client order ID was empty."}
                    '-1120': BadRequest, // {"code":-1120,"msg":"Invalid interval."}
                    '-1121': BadSymbol, // {"code":-1121,"msg":"Invalid symbol."}
                    '-1125': AuthenticationError, // {"code":-1125,"msg":"This listenKey does not exist."}
                    '-1127': BadRequest, // {"code":-1127,"msg":"More than %s hours between startTime and endTime."}
                    '-1128': BadRequest, // {"code":-1128,"msg":"{"code":-1128,"msg":"Combination of optional parameters invalid."}"}
                    '-1130': BadRequest, // {"code":-1130,"msg":"Data sent for paramter %s is not valid."}
                    '-1131': BadRequest, // {"code":-1131,"msg":"recvWindow must be less than 60000"}
                    '-1136': BadRequest, // {"code":-1136,"msg":"Invalid newOrderRespType"}
                    '-2008': AuthenticationError, // {"code":-2008,"msg":"Invalid Api-Key ID."}
                    '-2010': ExchangeError, // {"code":-2010,"msg":"generic error code for createOrder -> 'Account has insufficient balance for requested action.', {"code":-2010,"msg":"Rest API trading is not enabled."}, etc..."}
                    '-2011': OrderNotFound, // {"code":-2011,"msg":"cancelOrder(1, 'BTC/USDT') -> 'UNKNOWN_ORDER'"}
                    '-2013': OrderNotFound, // {"code":-2013,"msg":"fetchOrder (1, 'BTC/USDT') -> 'Order does not exist'"}
                    '-2014': AuthenticationError, // {"code":-2014,"msg":"API-key format invalid."}
                    '-2015': AuthenticationError, // {"code":-2015,"msg":"Invalid API-key, IP, or permissions for action."}
                    '-2016': BadRequest, // {"code":-2016,"msg":"No trading window could be found for the symbol. Try ticker/24hrs instead."}
                    '-2018': InsufficientFunds, // {"code":-2018,"msg":"Balance is insufficient"}
                    '-2019': InsufficientFunds, // {"code":-2019,"msg":"Margin is insufficient."}
                    '-2020': OrderNotFillable, // {"code":-2020,"msg":"Unable to fill."}
                    '-2021': OrderImmediatelyFillable, // {"code":-2021,"msg":"Order would immediately trigger."}
                    '-2022': InvalidOrder, // {"code":-2022,"msg":"ReduceOnly Order is rejected."}
                    '-2023': InsufficientFunds, // {"code":-2023,"msg":"User in liquidation mode now."}
                    '-2024': InsufficientFunds, // {"code":-2024,"msg":"Position is not sufficient."}
                    '-2025': InvalidOrder, // {"code":-2025,"msg":"Reach max open order limit."}
                    '-2026': InvalidOrder, // {"code":-2026,"msg":"This OrderType is not supported when reduceOnly."}
                    '-2027': InvalidOrder, // {"code":-2027,"msg":"Exceeded the maximum allowable position at current leverage."}
                    '-2028': InsufficientFunds, // {"code":-2028,"msg":"Leverage is smaller than permitted: insufficient margin balance"}
                    '-3000': ExchangeError, // {"code":-3000,"msg":"Internal server error."}
                    '-3001': AuthenticationError, // {"code":-3001,"msg":"Please enable 2FA first."}
                    '-3002': BadSymbol, // {"code":-3002,"msg":"We don't have this asset."}
                    '-3003': BadRequest, // {"code":-3003,"msg":"Margin account does not exist."}
                    '-3004': ExchangeError, // {"code":-3004,"msg":"Trade not allowed."}
                    '-3005': InsufficientFunds, // {"code":-3005,"msg":"Transferring out not allowed. Transfer out amount exceeds max amount."}
                    '-3006': InsufficientFunds, // {"code":-3006,"msg":"Your borrow amount has exceed maximum borrow amount."}
                    '-3007': ExchangeError, // {"code":-3007,"msg":"You have pending transaction, please try again later.."}
                    '-3008': InsufficientFunds, // {"code":-3008,"msg":"Borrow not allowed. Your borrow amount has exceed maximum borrow amount."}
                    '-3009': BadRequest, // {"code":-3009,"msg":"This asset are not allowed to transfer into margin account currently."}
                    '-3010': ExchangeError, // {"code":-3010,"msg":"Repay not allowed. Repay amount exceeds borrow amount."}
                    '-3011': BadRequest, // {"code":-3011,"msg":"Your input date is invalid."}
                    '-3012': ExchangeError, // {"code":-3012,"msg":"Borrow is banned for this asset."}
                    '-3013': BadRequest, // {"code":-3013,"msg":"Borrow amount less than minimum borrow amount."}
                    '-3014': AccountSuspended, // {"code":-3014,"msg":"Borrow is banned for this account."}
                    '-3015': ExchangeError, // {"code":-3015,"msg":"Repay amount exceeds borrow amount."}
                    '-3016': BadRequest, // {"code":-3016,"msg":"Repay amount less than minimum repay amount."}
                    '-3017': ExchangeError, // {"code":-3017,"msg":"This asset are not allowed to transfer into margin account currently."}
                    '-3018': AccountSuspended, // {"code":-3018,"msg":"Transferring in has been banned for this account."}
                    '-3019': AccountSuspended, // {"code":-3019,"msg":"Transferring out has been banned for this account."}
                    '-3020': InsufficientFunds, // {"code":-3020,"msg":"Transfer out amount exceeds max amount."}
                    '-3021': BadRequest, // {"code":-3021,"msg":"Margin account are not allowed to trade this trading pair."}
                    '-3022': AccountSuspended, // {"code":-3022,"msg":"You account's trading is banned."}
                    '-3023': BadRequest, // {"code":-3023,"msg":"You can't transfer out/place order under current margin level."}
                    '-3024': ExchangeError, // {"code":-3024,"msg":"The unpaid debt is too small after this repayment."}
                    '-3025': BadRequest, // {"code":-3025,"msg":"Your input date is invalid."}
                    '-3026': BadRequest, // {"code":-3026,"msg":"Your input param is invalid."}
                    '-3027': BadSymbol, // {"code":-3027,"msg":"Not a valid margin asset."}
                    '-3028': BadSymbol, // {"code":-3028,"msg":"Not a valid margin pair."}
                    '-3029': ExchangeError, // {"code":-3029,"msg":"Transfer failed."}
                    '-3036': AccountSuspended, // {"code":-3036,"msg":"This account is not allowed to repay."}
                    '-3037': ExchangeError, // {"code":-3037,"msg":"PNL is clearing. Wait a second."}
                    '-3038': BadRequest, // {"code":-3038,"msg":"Listen key not found."}
                    '-3041': InsufficientFunds, // {"code":-3041,"msg":"Balance is not enough"}
                    '-3042': BadRequest, // {"code":-3042,"msg":"PriceIndex not available for this margin pair."}
                    '-3043': BadRequest, // {"code":-3043,"msg":"Transferring in not allowed."}
                    '-3044': DDoSProtection, // {"code":-3044,"msg":"System busy."}
                    '-3045': ExchangeError, // {"code":-3045,"msg":"The system doesn't have enough asset now."}
                    '-3999': ExchangeError, // {"code":-3999,"msg":"This function is only available for invited users."}
                    '-4001': BadRequest, // {"code":-4001 ,"msg":"Invalid operation."}
                    '-4002': BadRequest, // {"code":-4002 ,"msg":"Invalid get."}
                    '-4003': BadRequest, // {"code":-4003 ,"msg":"Your input email is invalid."}
                    '-4004': AuthenticationError, // {"code":-4004,"msg":"You don't login or auth."}
                    '-4005': RateLimitExceeded, // {"code":-4005 ,"msg":"Too many new requests."}
                    '-4006': BadRequest, // {"code":-4006 ,"msg":"Support main account only."}
                    '-4007': BadRequest, // {"code":-4007 ,"msg":"Address validation is not passed."}
                    '-4008': BadRequest, // {"code":-4008 ,"msg":"Address tag validation is not passed."}
                    '-4010': BadRequest, // {"code":-4010 ,"msg":"White list mail has been confirmed."} // [TODO] possible bug: it should probably be "has not been confirmed"
                    '-4011': BadRequest, // {"code":-4011 ,"msg":"White list mail is invalid."}
                    '-4012': BadRequest, // {"code":-4012 ,"msg":"White list is not opened."}
                    '-4013': AuthenticationError, // {"code":-4013 ,"msg":"2FA is not opened."}
                    '-4014': PermissionDenied, // {"code":-4014 ,"msg":"Withdraw is not allowed within 2 min login."}
                    '-4015': ExchangeError, // {"code":-4015 ,"msg":"Withdraw is limited."}
                    '-4016': PermissionDenied, // {"code":-4016 ,"msg":"Within 24 hours after password modification, withdrawal is prohibited."}
                    '-4017': PermissionDenied, // {"code":-4017 ,"msg":"Within 24 hours after the release of 2FA, withdrawal is prohibited."}
                    '-4018': BadSymbol, // {"code":-4018,"msg":"We don't have this asset."}
                    '-4019': BadSymbol, // {"code":-4019,"msg":"Current asset is not open for withdrawal."}
                    '-4021': BadRequest, // {"code":-4021,"msg":"Asset withdrawal must be an %s multiple of %s."}
                    '-4022': BadRequest, // {"code":-4022,"msg":"Not less than the minimum pick-up quantity %s."}
                    '-4023': ExchangeError, // {"code":-4023,"msg":"Within 24 hours, the withdrawal exceeds the maximum amount."}
                    '-4024': InsufficientFunds, // {"code":-4024,"msg":"You don't have this asset."}
                    '-4025': InsufficientFunds, // {"code":-4025,"msg":"The number of hold asset is less than zero."}
                    '-4026': InsufficientFunds, // {"code":-4026,"msg":"You have insufficient balance."}
                    '-4027': ExchangeError, // {"code":-4027,"msg":"Failed to obtain tranId."}
                    '-4028': BadRequest, // {"code":-4028,"msg":"The amount of withdrawal must be greater than the Commission."}
                    '-4029': BadRequest, // {"code":-4029,"msg":"The withdrawal record does not exist."}
                    '-4030': ExchangeError, // {"code":-4030,"msg":"Confirmation of successful asset withdrawal. [TODO] possible bug in docs"}
                    '-4031': ExchangeError, // {"code":-4031,"msg":"Cancellation failed."}
                    '-4032': ExchangeError, // {"code":-4032,"msg":"Withdraw verification exception."}
                    '-4033': BadRequest, // {"code":-4033,"msg":"Illegal address."}
                    '-4034': ExchangeError, // {"code":-4034,"msg":"The address is suspected of fake."}
                    '-4035': PermissionDenied, // {"code":-4035,"msg":"This address is not on the whitelist. Please join and try again."}
                    '-4036': BadRequest, // {"code":-4036,"msg":"The new address needs to be withdrawn in {0} hours."}
                    '-4037': ExchangeError, // {"code":-4037,"msg":"Re-sending Mail failed."}
                    '-4038': ExchangeError, // {"code":-4038,"msg":"Please try again in 5 minutes."}
                    '-4039': BadRequest, // {"code":-4039,"msg":"The user does not exist."}
                    '-4040': BadRequest, // {"code":-4040,"msg":"This address not charged."}
                    '-4041': ExchangeError, // {"code":-4041,"msg":"Please try again in one minute."}
                    '-4042': ExchangeError, // {"code":-4042,"msg":"This asset cannot get deposit address again."}
                    '-4043': BadRequest, // {"code":-4043,"msg":"More than 100 recharge addresses were used in 24 hours."}
                    '-4044': BadRequest, // {"code":-4044,"msg":"This is a blacklist country."}
                    '-4045': ExchangeError, // {"code":-4045,"msg":"Failure to acquire assets."}
                    '-4046': AuthenticationError, // {"code":-4046,"msg":"Agreement not confirmed."}
                    '-4047': BadRequest, // {"code":-4047,"msg":"Time interval must be within 0-90 days"}
                    '-5001': BadRequest, // {"code":-5001,"msg":"Don't allow transfer to micro assets."}
                    '-5002': InsufficientFunds, // {"code":-5002,"msg":"You have insufficient balance."}
                    '-5003': InsufficientFunds, // {"code":-5003,"msg":"You don't have this asset."}
                    '-5004': BadRequest, // {"code":-5004,"msg":"The residual balances of %s have exceeded 0.001BTC, Please re-choose."}
                    '-5005': InsufficientFunds, // {"code":-5005,"msg":"The residual balances of %s is too low, Please re-choose."}
                    '-5006': BadRequest, // {"code":-5006,"msg":"Only transfer once in 24 hours."}
                    '-5007': BadRequest, // {"code":-5007,"msg":"Quantity must be greater than zero."}
                    '-5008': InsufficientFunds, // {"code":-5008,"msg":"Insufficient amount of returnable assets."}
                    '-5009': BadRequest, // {"code":-5009,"msg":"Product does not exist."}
                    '-5010': ExchangeError, // {"code":-5010,"msg":"Asset transfer fail."}
                    '-5011': BadRequest, // {"code":-5011,"msg":"future account not exists."}
                    '-5012': ExchangeError, // {"code":-5012,"msg":"Asset transfer is in pending."}
                    '-5013': InsufficientFunds, // {"code":-5013,"msg":"Asset transfer failed: insufficient balance""} // undocumented
                    '-5021': BadRequest, // {"code":-5021,"msg":"This parent sub have no relation"}
                    '-6001': BadRequest, // {"code":-6001,"msg":"Daily product not exists."}
                    '-6003': BadRequest, // {"code":-6003,"msg":"Product not exist or you don't have permission"}
                    '-6004': ExchangeError, // {"code":-6004,"msg":"Product not in purchase status"}
                    '-6005': InvalidOrder, // {"code":-6005,"msg":"Smaller than min purchase limit"}
                    '-6006': BadRequest, // {"code":-6006,"msg":"Redeem amount error"}
                    '-6007': BadRequest, // {"code":-6007,"msg":"Not in redeem time"}
                    '-6008': BadRequest, // {"code":-6008,"msg":"Product not in redeem status"}
                    '-6009': RateLimitExceeded, // {"code":-6009,"msg":"Request frequency too high"}
                    '-6011': BadRequest, // {"code":-6011,"msg":"Exceeding the maximum num allowed to purchase per user"}
                    '-6012': InsufficientFunds, // {"code":-6012,"msg":"Balance not enough"}
                    '-6013': ExchangeError, // {"code":-6013,"msg":"Purchasing failed"}
                    '-6014': BadRequest, // {"code":-6014,"msg":"Exceed up-limit allowed to purchased"}
                    '-6015': BadRequest, // {"code":-6015,"msg":"Empty request body"}
                    '-6016': BadRequest, // {"code":-6016,"msg":"Parameter err"}
                    '-6017': BadRequest, // {"code":-6017,"msg":"Not in whitelist"}
                    '-6018': BadRequest, // {"code":-6018,"msg":"Asset not enough"}
                    '-6019': AuthenticationError, // {"code":-6019,"msg":"Need confirm"}
                    '-6020': BadRequest, // {"code":-6020,"msg":"Project not exists"}
                    '-7001': BadRequest, // {"code":-7001,"msg":"Date range is not supported."}
                    '-7002': BadRequest, // {"code":-7002,"msg":"Data request type is not supported."}
                    '-10017': BadRequest, // {"code":-10017,"msg":"Repay amount should not be larger than liability."}
                    '-11008': InsufficientFunds, // {"code":-11008,"msg":"Exceeding the account's maximum borrowable limit."} // undocumented
                    '-12014': RateLimitExceeded, // {"code":-12014,"msg":"More than 1 request in 3 seconds"}
                    '-13000': BadRequest, // {"code":-13000,"msg":"Redeption of the token is forbiden now"}
                    '-13001': BadRequest, // {"code":-13001,"msg":"Exceeds individual 24h redemption limit of the token"}
                    '-13002': BadRequest, // {"code":-13002,"msg":"Exceeds total 24h redemption limit of the token"}
                    '-13003': BadRequest, // {"code":-13003,"msg":"Subscription of the token is forbiden now"}
                    '-13004': BadRequest, // {"code":-13004,"msg":"Exceeds individual 24h subscription limit of the token"}
                    '-13005': BadRequest, // {"code":-13005,"msg":"Exceeds total 24h subscription limit of the token"}
                    '-13006': InvalidOrder, // {"code":-13006,"msg":"Subscription amount is too small"}
                    '-13007': AuthenticationError, // {"code":-13007,"msg":"The Agreement is not signed"}
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
        } else {
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
        } else if (type === 'delivery') {
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
            throw new ArgumentsRequired(' fetchOrder() precisa do id da ordem como parâmetro');
        }
        const request = {
            'id': id
        };
        let method = 'privateGetFetchOrder';
        const response = await this[method](this.extend(request));
        return response;
    }

    async fetchOrders(symbol, limit, since = undefined, params = {}) {
        if (symbol === undefined) {
            throw new ArgumentsRequired(' fetchOrders() precisa do symbol como parâmetro');
        }

        const request = {
            'symbol': symbol,
            'limit': limit || 50
        };
        let method = 'privateGetFetchOrders';
        const response = await this[method](this.extend(request, params));
        return response;
    }

    parseBalance(response, type = undefined) {
        const result = {
            'info': response,
        };
        let timestamp = undefined;
        if ((type === 'spot') || (type === 'margin')) {
            timestamp = this.safeInteger(response, 'updateTime');
            const balances = this.safeValue2(response, 'balances', 'userAssets', []);
            for (let i = 0; i < balances.length; i++) {
                const balance = balances[i];
                const currencyId = this.safeString(balance, 'asset');
                const code = this.safeCurrencyCode(currencyId);
                const account = this.account();
                account['free'] = this.safeString(balance, 'free');
                account['used'] = this.safeString(balance, 'locked');
                result[code] = account;
            }
        } else if (type === 'savings') {
            const positionAmountVos = this.safeValue(response, 'positionAmountVos');
            for (let i = 0; i < positionAmountVos.length; i++) {
                const entry = positionAmountVos[i];
                const currencyId = this.safeString(entry, 'asset');
                const code = this.safeCurrencyCode(currencyId);
                const account = this.account();
                const usedAndTotal = this.safeString(entry, 'amount');
                account['total'] = usedAndTotal;
                account['used'] = usedAndTotal;
                result[code] = account;
            }
        } else if (type === 'funding') {
            for (let i = 0; i < response.length; i++) {
                const entry = response[i];
                const account = this.account();
                const currencyId = this.safeString(entry, 'asset');
                const code = this.safeCurrencyCode(currencyId);
                account['free'] = this.safeString(entry, 'free');
                const frozen = this.safeString(entry, 'freeze');
                const withdrawing = this.safeString(entry, 'withdrawing');
                const locked = this.safeString(entry, 'locked');
                account['used'] = Precise.stringAdd(frozen, Precise.stringAdd(locked, withdrawing));
                result[code] = account;
            }
        } else {
            let balances = response;
            if (!Array.isArray(response)) {
                balances = this.safeValue(response, 'assets', []);
            }
            for (let i = 0; i < balances.length; i++) {
                const balance = balances[i];
                const currencyId = this.safeString(balance, 'asset');
                const code = this.safeCurrencyCode(currencyId);
                const account = this.account();
                account['free'] = this.safeString(balance, 'availableBalance');
                account['used'] = this.safeString(balance, 'initialMargin');
                account['total'] = this.safeString2(balance, 'marginBalance', 'balance');
                result[code] = account;
            }
        }
        result['timestamp'] = timestamp;
        result['datetime'] = this.iso8601(timestamp);
        return this.safeBalance(result);
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
        let method = 'publicGetFetchOrderBook';
        const response = await this[method](this.extend(request, params));
        return response;
    }

    parseTicker(ticker, market = undefined) {
        const timestamp = this.safeInteger(ticker, 'closeTime');
        const marketId = this.safeString(ticker, 'symbol');
        const symbol = this.safeSymbol(marketId, market);
        const last = this.safeString(ticker, 'lastPrice');
        const isCoinm = ('baseVolume' in ticker);
        let baseVolume = undefined;
        let quoteVolume = undefined;
        if (isCoinm) {
            baseVolume = this.safeString(ticker, 'baseVolume');
            quoteVolume = this.safeString(ticker, 'volume');
        } else {
            baseVolume = this.safeString(ticker, 'volume');
            quoteVolume = this.safeString(ticker, 'quoteVolume');
        }
        return this.safeTicker({
            'symbol': symbol,
            'timestamp': timestamp,
            'datetime': this.iso8601(timestamp),
            'high': this.safeString(ticker, 'highPrice'),
            'low': this.safeString(ticker, 'lowPrice'),
            'bid': this.safeString(ticker, 'bidPrice'),
            'bidVolume': this.safeString(ticker, 'bidQty'),
            'ask': this.safeString(ticker, 'askPrice'),
            'askVolume': this.safeString(ticker, 'askQty'),
            'vwap': this.safeString(ticker, 'weightedAvgPrice'),
            'open': this.safeString(ticker, 'openPrice'),
            'close': last,
            'last': last,
            'previousClose': this.safeString(ticker, 'prevClosePrice'), // previous day close
            'change': this.safeString(ticker, 'priceChange'),
            'percentage': this.safeString(ticker, 'priceChangePercent'),
            'average': undefined,
            'baseVolume': baseVolume,
            'quoteVolume': quoteVolume,
            'info': ticker,
        }, market, false);
    }

    async fetchStatus(params = {}) {
        const response = await this.sapiGetSystemStatus(params);
        let status = this.safeString(response, 'status');
        if (status !== undefined) {
            status = (status === '0') ? 'ok' : 'maintenance';
            this.status = this.extend(this.status, {
                'status': status,
                'updated': this.milliseconds(),
            });
        }
        return this.status;
    }

    async fetchTicker(symbol, params = {}) {
        const request = {
            'symbol': symbol,
        };
        let method = 'publicGetFetchTicker';
        const response = await this[method](this.extend(request, params));
        return response;
    }

    async fetchBidsAsks(symbols = undefined, params = {}) {
        await this.loadMarkets();
        const defaultType = this.safeString2(this.options, 'fetchBidsAsks', 'defaultType', 'spot');
        const type = this.safeString(params, 'type', defaultType);
        const query = this.omit(params, 'type');
        let method = undefined;
        if (type === 'future') {
            method = 'fapiPublicGetTickerBookTicker';
        } else if (type === 'delivery') {
            method = 'dapiPublicGetTickerBookTicker';
        } else {
            method = 'publicGetTickerBookTicker';
        }
        const response = await this[method](query);
        return this.parseTickers(response, symbols);
    }

    async fetchTickers(limit, params = {}) {
        const request = {
            'limit': limit || 1000,
        };
        const method = 'publicGetFetchTickers';
        const response = await this[method](this.extend(request, params));
        return response;
    }

    parseOHLCV(ohlcv, market = undefined) {
        return [
            this.safeInteger(ohlcv, 0),
            this.safeNumber(ohlcv, 1),
            this.safeNumber(ohlcv, 2),
            this.safeNumber(ohlcv, 3),
            this.safeNumber(ohlcv, 4),
            this.safeNumber(ohlcv, 5),
        ];
    }

    async fetchOHLCV(symbol, internal = '1m', limit = 500, params = {}) {

        const request = {
            'symbol': symbol,
            'interval': internal,
            'limit': limit
        };
        let method = 'publicGetFetchOHLCV';
        const response = await this[method](this.extend(request, params));
        return response;
    }

    async fetchMarkOHLCV(symbol, timeframe = '1m', since = undefined, limit = undefined, params = {}) {
        const request = {
            'price': 'mark',
        };
        return await this.fetchOHLCV(symbol, timeframe, since, limit, this.extend(request, params));
    }

    async fetchIndexOHLCV(symbol, timeframe = '1m', since = undefined, limit = undefined, params = {}) {
        const request = {
            'price': 'index',
        };
        return await this.fetchOHLCV(symbol, timeframe, since, limit, this.extend(request, params));
    }

    parseTrade(trade, market = undefined) {
        if ('isDustTrade' in trade) {
            return this.parseDustTrade(trade, market);
        }
        const timestamp = this.safeInteger2(trade, 'T', 'time');
        const price = this.safeString2(trade, 'p', 'price');
        const amount = this.safeString2(trade, 'q', 'qty');
        const cost = this.safeString2(trade, 'quoteQty', 'baseQty');  // inverse futures
        const marketId = this.safeString(trade, 'symbol');
        const symbol = this.safeSymbol(marketId, market);
        let id = this.safeString2(trade, 't', 'a');
        id = this.safeString2(trade, 'id', 'tradeId', id);
        let side = undefined;
        const orderId = this.safeString(trade, 'orderId');
        if ('m' in trade) {
            side = trade['m'] ? 'sell' : 'buy'; // this is reversed intentionally
        } else if ('isBuyerMaker' in trade) {
            side = trade['isBuyerMaker'] ? 'sell' : 'buy';
        } else if ('side' in trade) {
            side = this.safeStringLower(trade, 'side');
        } else {
            if ('isBuyer' in trade) {
                side = trade['isBuyer'] ? 'buy' : 'sell'; // this is a true side
            }
        }
        let fee = undefined;
        if ('commission' in trade) {
            fee = {
                'cost': this.safeString(trade, 'commission'),
                'currency': this.safeCurrencyCode(this.safeString(trade, 'commissionAsset')),
            };
        }
        let takerOrMaker = undefined;
        if ('isMaker' in trade) {
            takerOrMaker = trade['isMaker'] ? 'maker' : 'taker';
        }
        if ('maker' in trade) {
            takerOrMaker = trade['maker'] ? 'maker' : 'taker';
        }
        return this.safeTrade({
            'info': trade,
            'timestamp': timestamp,
            'datetime': this.iso8601(timestamp),
            'symbol': symbol,
            'id': id,
            'order': orderId,
            'type': undefined,
            'side': side,
            'takerOrMaker': takerOrMaker,
            'price': price,
            'amount': amount,
            'cost': cost,
            'fee': fee,
        }, market);
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

    parseOrderStatus(status) {
        const statuses = {
            'NEW': 'open',
            'PARTIALLY_FILLED': 'open',
            'FILLED': 'closed',
            'CANCELED': 'canceled',
            'PENDING_CANCEL': 'canceling', // currently unused
            'REJECTED': 'rejected',
            'EXPIRED': 'expired',
        };
        return this.safeString(statuses, status, status);
    }

    parseOrder(order, market = undefined) {
        const status = this.parseOrderStatus(this.safeString(order, 'status'));
        const marketId = this.safeString(order, 'symbol');
        const symbol = this.safeSymbol(marketId, market);
        const filled = this.safeString(order, 'executedQty', '0');
        let timestamp = undefined;
        let lastTradeTimestamp = undefined;
        if ('time' in order) {
            timestamp = this.safeInteger(order, 'time');
        } else if ('transactTime' in order) {
            timestamp = this.safeInteger(order, 'transactTime');
        } else if ('updateTime' in order) {
            if (status === 'open') {
                if (Precise.stringGt(filled, '0')) {
                    lastTradeTimestamp = this.safeInteger(order, 'updateTime');
                } else {
                    timestamp = this.safeInteger(order, 'updateTime');
                }
            }
        }
        const average = this.safeString(order, 'avgPrice');
        const price = this.safeString(order, 'price');
        const amount = this.safeString(order, 'origQty');
        // - Spot/Margin market: cummulativeQuoteQty
        // - Futures market: cumQuote.
        //   Note this is not the actual cost, since Liqi futures uses leverage to calculate margins.
        let cost = this.safeString2(order, 'cummulativeQuoteQty', 'cumQuote');
        cost = this.safeString(order, 'cumBase', cost);
        const id = this.safeString(order, 'orderId');
        let type = this.safeStringLower(order, 'type');
        const side = this.safeStringLower(order, 'side');
        const fills = this.safeValue(order, 'fills', []);
        const clientOrderId = this.safeString(order, 'clientOrderId');
        let timeInForce = this.safeString(order, 'timeInForce');
        if (timeInForce === 'GTX') {
            // GTX means "Good Till Crossing" and is an equivalent way of saying Post Only
            timeInForce = 'PO';
        }
        const postOnly = (type === 'limit_maker') || (timeInForce === 'PO');
        if (type === 'limit_maker') {
            type = 'limit';
        }
        const stopPriceString = this.safeString(order, 'stopPrice');
        const stopPrice = this.parseNumber(this.omitZero(stopPriceString));
        return this.safeOrder({
            'info': order,
            'id': id,
            'clientOrderId': clientOrderId,
            'timestamp': timestamp,
            'datetime': this.iso8601(timestamp),
            'lastTradeTimestamp': lastTradeTimestamp,
            'symbol': symbol,
            'type': type,
            'timeInForce': timeInForce,
            'postOnly': postOnly,
            'side': side,
            'price': price,
            'stopPrice': stopPrice,
            'amount': amount,
            'cost': cost,
            'average': average,
            'filled': filled,
            'remaining': undefined,
            'status': status,
            'fee': undefined,
            'trades': fills,
        }, market);
    }

    async createReduceOnlyOrder(symbol, type, side, amount, price = undefined, params = {}) {
        const request = {
            'reduceOnly': true,
        };
        return await this.createOrder(symbol, type, side, amount, price, this.extend(request, params));
    }

    async createOrder(symbol, type, side, amount = undefined, price = undefined, quoteAmount = undefined, params = {}) {

        const request = {
            'symbol': symbol,
            'type': type,
            'side': side,
            'amount': amount,
            'price': price,
            'quoteAmount': quoteAmount
        };
        let method = 'privatePostCreateOrder';
        const response = await this[method](this.extend(request, params));
        return response;
    }

    async fetchOpenOrders(symbol = undefined, since = undefined, limit = undefined, params = {}) {
        if (symbol === undefined) {
            throw new ArgumentsRequired(' fetchOpenOrders() precisa do symbol como parâmetro');
        }

        const request = {
            'symbol': symbol,
            'limit': limit || 50
        };
        let method = 'privateGetFetchOpenOrders';
        const response = await this[method](this.extend(request, params));
        return response;
    }

    async fetchClosedOrders(symbol = undefined, since = undefined, limit = undefined, params = {}) {
        const orders = await this.fetchOrders(symbol, since, limit, params);
        return this.filterBy(orders, 'status', 'closed');
    }

    async cancelOrder(id, params = {}) {
        const request = {
            'id': id
        };
        let method = 'privatePostCancelOrder';
        const response = await this[method](this.extend(request, params));
        return response;
    }

    async cancelAllOrders(symbol = undefined, params = {}) {
        if (symbol === undefined) {
            throw new ArgumentsRequired(this.id + ' cancelAllOrders() requires a symbol argument');
        }
        // await this.loadMarkets();
        // const market = this.market(symbol);
        const request = {
            'symbol': symbol,
        };
        let method = 'privatePostCancelAllOrders';
        const response = await this[method](this.extend(request, params));
        return response;
    }

    async fetchOrderTrades(id, symbol = undefined, since = undefined, limit = undefined, params = {}) {
        if (symbol === undefined) {
            throw new ArgumentsRequired(this.id + ' fetchOrderTrades() requires a symbol argument');
        }
        await this.loadMarkets();
        const market = this.market(symbol);
        const type = this.safeString(params, 'type', market['type']);
        params = this.omit(params, 'type');
        if (type !== 'spot') {
            throw new NotSupported(this.id + ' fetchOrderTrades() supports spot markets only');
        }
        const request = {
            'orderId': id,
        };
        return await this.fetchMyTrades(symbol, since, limit, this.extend(request, params));
    }

    async fetchMyTrades(symbol = undefined, since = undefined, limit = undefined, params = {}) {
        if (symbol === undefined) {
            throw new ArgumentsRequired(this.id + ' fetchMyTrades() requires a symbol argument');
        }
        await this.loadMarkets();
        const market = this.market(symbol);
        const type = this.safeString(params, 'type', market['type']);
        params = this.omit(params, 'type');
        let method = undefined;
        if (type === 'spot') {
            method = 'privateGetMyTrades';
        } else if (type === 'margin') {
            method = 'sapiGetMarginMyTrades';
        } else if (type === 'future') {
            method = 'fapiPrivateGetUserTrades';
        } else if (type === 'delivery') {
            method = 'dapiPrivateGetUserTrades';
        }
        const request = {
            'symbol': market['id'],
        };
        if (since !== undefined) {
            request['startTime'] = since;
        }
        if (limit !== undefined) {
            request['limit'] = limit;
        }
        const response = await this[method](this.extend(request, params));
        return this.parseTrades(response, market, since, limit);
    }

    async fetchMyDustTrades(symbol = undefined, since = undefined, limit = undefined, params = {}) {
        //
        // Liqi provides an opportunity to trade insignificant (i.e. non-tradable and non-withdrawable)
        // token leftovers (of any asset) into `BNB` coin which in turn can be used to pay trading fees with it.
        // The corresponding trades history is called the `Dust Log` and can be requested via the following end-point:
        // https://github.com/liqi-exchange/liqi-official-api-docs/blob/master/wapi-api.md#dustlog-user_data
        //
        await this.loadMarkets();
        const request = {};
        if (since !== undefined) {
            request['startTime'] = since;
            request['endTime'] = this.sum(since, 7776000000);
        }
        const response = await this.sapiGetAssetDribblet(this.extend(request, params));
        const results = this.safeValue(response, 'userAssetDribblets', []);
        const rows = this.safeInteger(response, 'total', 0);
        const data = [];
        for (let i = 0; i < rows; i++) {
            const logs = this.safeValue(results[i], 'userAssetDribbletDetails', []);
            for (let j = 0; j < logs.length; j++) {
                logs[j]['isDustTrade'] = true;
                data.push(logs[j]);
            }
        }
        const trades = this.parseTrades(data, undefined, since, limit);
        return this.filterBySinceLimit(trades, since, limit);
    }

    signEcdsa(request, secret, algorithm = 'ed25519') {
        const clientFromPriv = new EC(algorithm).keyFromPrivate(secret, 'hex');
        const signature = this.toDER(clientFromPriv.sign(request), 'hex');
        return signature;
    }

    toDER(signature, enc) {
        var r = signature.r.toArray();
        var s = signature.s.toArray();

        // Pad values
        if (r[0] & 0x80)
            r = [0].concat(r);
        // Pad values
        if (s[0] & 0x80)
            s = [0].concat(s);

        r = this.rmPadding(r);
        s = this.rmPadding(s);

        while (!s[0] && !(s[1] & 0x80)) {
            s = s.slice(1);
        }
        var arr = [0x02];
        this.constructLength(arr, r.length);
        arr = arr.concat(r);
        arr.push(0x02);
        this.constructLength(arr, s.length);
        var backHalf = arr.concat(s);
        var res = [0x30];
        this.constructLength(res, backHalf.length);
        res = res.concat(backHalf);
        return utils.encode(res, enc);
    };

    constructLength(arr, len) {
        if (len < 0x80) {
            arr.push(len);
            return;
        }
        var octets = 1 + (Math.log(len) / Math.LN2 >>> 3);
        arr.push(octets | 0x80);
        while (--octets) {
            arr.push((len >>> (octets << 3)) & 0xff);
        }
        arr.push(len);
    }

    rmPadding(buf) {
        var i = 0;
        var len = buf.length - 1;
        while (!buf[i] && !(buf[i + 1] & 0x80) && i < len) {
            i++;
        }
        if (i === 0) {
            return buf;
        }
        return buf.slice(i);
    }

    sign(path, api = 'public', method = 'GET', params = {}, headers = undefined, body = undefined) {
        if (!(api in this.urls['api'])) {
            throw new NotSupported(this.id + ' does not have a testnet/sandbox URL for ' + api + ' endpoints');
        }
        let url = this.urls['api'][api] + '/' + this.implodeParams(path, this.encode(params));

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
            const hash = this.hash(query, 'sha256', 'hex');
            const signature = this.signEcdsa(hash, this.secret, 'ed25519');
            headers = {
                'signature': signature,
                'X-MBX-APIKEY': this.apiKey,
            };
            if ((method === 'GET') || (method === 'DELETE') || (api === 'wapi')) {
                url += '?' + query;
            } else {
                body = query;
                headers['Content-Type'] = 'application/x-www-form-urlencoded';
            }
        } else {
            if (Object.keys(params).length) {
                url += '?' + this.urlencode(params);
            }
        }

        //headers = { ...headers, useragent: 'CCXT/Liqi', cookie: `incap_ses_1235_2761709=WbRwX37PHxg/KU1Ek5ojEWEteWIAAAAAH3TLBixu3GHgER/qGSN42A==; nlbi_2761709=bCMFIGqgDUwwTEEvasLBCgAAAABq11FI6oMxSqTvSx/0ZC+Y; visid_incap_2761709=6dHV2ACcQbK6Cv86NGb1RW0jO2IAAAAAQkIPAAAAAABxst/YXNsWFkm5OgFiOjMD` };

        return { 'url': url, 'method': method, 'body': body, 'headers': headers };
    }

    handleErrors(code, reason, url, method, headers, body, response, requestHeaders, requestBody) {
        if ((code === 418) || (code === 429)) {
            throw new DDoSProtection(this.id + ' ' + code.toString() + ' ' + reason + ' ' + body);
        }
        // error response in a form: { "code": -1013, "msg": "Invalid quantity." }
        // following block cointains legacy checks against message patterns in "msg" property
        // will switch "code" checks eventually, when we know all of them
        if (code >= 400) {
            if (body.indexOf('Price * QTY is zero or less') >= 0) {
                throw new InvalidOrder(this.id + ' order cost = amount * price is zero or less ' + body);
            }
            if (body.indexOf('LOT_SIZE') >= 0) {
                throw new InvalidOrder(this.id + ' order amount should be evenly divisible by lot size ' + body);
            }
            if (body.indexOf('PRICE_FILTER') >= 0) {
                throw new InvalidOrder(this.id + ' order price is invalid, i.e. exceeds allowed price precision, exceeds min price or max price limits or is invalid value in general, use this.priceToPrecision (symbol, amount) ' + body);
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
                } catch (e) {
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
            if ((error === '200') || Precise.stringEquals(error, '0')) {
                return undefined;
            }
            // a workaround for {"code":-2015,"msg":"Invalid API-key, IP, or permissions for action."}
            // despite that their message is very confusing, it is raised by Liqi
            // on a temporary ban, the API key is valid, but disabled for a while
            if ((error === '-2015') && this.options['hasAlreadyAuthenticatedSuccessfully']) {
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
        if ((api === 'private') || (api === 'wapi')) {
            this.options['hasAlreadyAuthenticatedSuccessfully'] = true;
        }
        return response;
    }
};
