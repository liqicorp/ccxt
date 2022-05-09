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
                        'fetchOHLCV': 50
                    },
                },
                'private': {
                    'get': {
                        'fetchBalance': 1,
                        'fetchOrders': 100,
                        'fetchOrder': 1,
                        'fetchTrades': 500
                    },
                    'post': {
                        'createOrder': 1,
                        'cancelOrder': 1
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
            'limit': limit,
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
        const response = await this[method](this.extend(request, params));
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

    async fetchTickers(symbols = undefined, params = {}) {
        await this.loadMarkets();
        const defaultType = this.safeString2(this.options, 'fetchTickers', 'defaultType', 'spot');
        const type = this.safeString(params, 'type', defaultType);
        const query = this.omit(params, 'type');
        let defaultMethod = undefined;
        if (type === 'future') {
            defaultMethod = 'fapiPublicGetTicker24hr';
        } else if (type === 'delivery') {
            defaultMethod = 'dapiPublicGetTicker24hr';
        } else {
            defaultMethod = 'publicGetTicker24hr';
        }
        const method = this.safeString(this.options, 'fetchTickersMethod', defaultMethod);
        const response = await this[method](query);
        return this.parseTickers(response, symbols);
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
        await this.loadMarkets();
        let market = undefined;
        let query = undefined;
        let type = undefined;
        const request = {};
        if (symbol !== undefined) {
            market = this.market(symbol);
            request['symbol'] = market['id'];
            const defaultType = this.safeString2(this.options, 'fetchOpenOrders', 'defaultType', 'spot');
            const marketType = ('type' in market) ? market['type'] : defaultType;
            type = this.safeString(params, 'type', marketType);
            query = this.omit(params, 'type');
        } else if (this.options['warnOnFetchOpenOrdersWithoutSymbol']) {
            const symbols = this.symbols;
            const numSymbols = symbols.length;
            const fetchOpenOrdersRateLimit = parseInt(numSymbols / 2);
            throw new ExchangeError(this.id + ' fetchOpenOrders WARNING: fetching open orders without specifying a symbol is rate-limited to one call per ' + fetchOpenOrdersRateLimit.toString() + ' seconds. Do not call this method frequently to avoid ban. Set ' + this.id + '.options["warnOnFetchOpenOrdersWithoutSymbol"] = false to suppress this warning message.');
        } else {
            const defaultType = this.safeString2(this.options, 'fetchOpenOrders', 'defaultType', 'spot');
            type = this.safeString(params, 'type', defaultType);
            query = this.omit(params, 'type');
        }
        let method = 'privateGetOpenOrders';
        if (type === 'future') {
            method = 'fapiPrivateGetOpenOrders';
        } else if (type === 'delivery') {
            method = 'dapiPrivateGetOpenOrders';
        } else if (type === 'margin') {
            method = 'sapiGetMarginOpenOrders';
        }
        const response = await this[method](this.extend(request, query));
        return this.parseOrders(response, market, since, limit);
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
        await this.loadMarkets();
        const market = this.market(symbol);
        const request = {
            'symbol': market['id'],
        };
        const defaultType = this.safeString2(this.options, 'cancelAllOrders', 'defaultType', 'spot');
        const type = this.safeString(params, 'type', defaultType);
        const query = this.omit(params, 'type');
        let method = 'privateDeleteOpenOrders';
        if (type === 'margin') {
            method = 'sapiDeleteMarginOpenOrders';
        } else if (type === 'future') {
            method = 'fapiPrivateDeleteAllOpenOrders';
        } else if (type === 'delivery') {
            method = 'dapiPrivateDeleteAllOpenOrders';
        }
        const response = await this[method](this.extend(request, query));
        if (Array.isArray(response)) {
            return this.parseOrders(response, market);
        } else {
            return response;
        }
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

    parseDustTrade(trade, market = undefined) {
        const orderId = this.safeString(trade, 'transId');
        const timestamp = this.safeInteger(trade, 'operateTime');
        const currencyId = this.safeString(trade, 'fromAsset');
        const tradedCurrency = this.safeCurrencyCode(currencyId);
        const bnb = this.currency('BNB');
        const earnedCurrency = bnb['code'];
        const applicantSymbol = earnedCurrency + '/' + tradedCurrency;
        let tradedCurrencyIsQuote = false;
        if (applicantSymbol in this.markets) {
            tradedCurrencyIsQuote = true;
        }
        const feeCostString = this.safeString(trade, 'serviceChargeAmount');
        const fee = {
            'currency': earnedCurrency,
            'cost': this.parseNumber(feeCostString),
        };
        let symbol = undefined;
        let amountString = undefined;
        let costString = undefined;
        let side = undefined;
        if (tradedCurrencyIsQuote) {
            symbol = applicantSymbol;
            amountString = this.safeString(trade, 'transferedAmount');
            costString = this.safeString(trade, 'amount');
            side = 'buy';
        } else {
            symbol = tradedCurrency + '/' + earnedCurrency;
            amountString = this.safeString(trade, 'amount');
            costString = this.safeString(trade, 'transferedAmount');
            side = 'sell';
        }
        let priceString = undefined;
        if (costString !== undefined) {
            if (amountString) {
                priceString = Precise.stringDiv(costString, amountString);
            }
        }
        const id = undefined;
        const amount = this.parseNumber(amountString);
        const price = this.parseNumber(priceString);
        const cost = this.parseNumber(costString);
        const type = undefined;
        const takerOrMaker = undefined;
        return {
            'id': id,
            'timestamp': timestamp,
            'datetime': this.iso8601(timestamp),
            'symbol': symbol,
            'order': orderId,
            'type': type,
            'takerOrMaker': takerOrMaker,
            'side': side,
            'amount': amount,
            'price': price,
            'cost': cost,
            'fee': fee,
            'info': trade,
        };
    }

    async fetchDeposits(code = undefined, since = undefined, limit = undefined, params = {}) {
        await this.loadMarkets();
        let currency = undefined;
        let response = undefined;
        const request = {};
        const legalMoney = this.safeValue(this.options, 'legalMoney', {});
        if (code in legalMoney) {
            if (code !== undefined) {
                currency = this.currency(code);
            }
            request['transactionType'] = 0;
            if (since !== undefined) {
                request['beginTime'] = since;
            }
            const raw = await this.sapiGetFiatOrders(this.extend(request, params));
            response = this.safeValue(raw, 'data');
        } else {
            if (code !== undefined) {
                currency = this.currency(code);
                request['coin'] = currency['id'];
            }
            if (since !== undefined) {
                request['startTime'] = since;
                // max 3 months range https://github.com/ccxt/ccxt/issues/6495
                request['endTime'] = this.sum(since, 7776000000);
            }
            if (limit !== undefined) {
                request['limit'] = limit;
            }
            response = await this.sapiGetCapitalDepositHisrec(this.extend(request, params));
        }
        return this.parseTransactions(response, currency, since, limit);
    }

    async fetchWithdrawals(code = undefined, since = undefined, limit = undefined, params = {}) {
        await this.loadMarkets();
        const legalMoney = this.safeValue(this.options, 'legalMoney', {});
        const request = {};
        let response = undefined;
        let currency = undefined;
        if (code in legalMoney) {
            if (code !== undefined) {
                currency = this.currency(code);
            }
            request['transactionType'] = 1;
            if (since !== undefined) {
                request['beginTime'] = since;
            }
            const raw = await this.sapiGetFiatOrders(this.extend(request, params));
            response = this.safeValue(raw, 'data');
        } else {
            if (code !== undefined) {
                currency = this.currency(code);
                request['coin'] = currency['id'];
            }
            if (since !== undefined) {
                request['startTime'] = since;
                // max 3 months range https://github.com/ccxt/ccxt/issues/6495
                request['endTime'] = this.sum(since, 7776000000);
            }
            if (limit !== undefined) {
                request['limit'] = limit;
            }
            response = await this.sapiGetCapitalWithdrawHistory(this.extend(request, params));
        }
        return this.parseTransactions(response, currency, since, limit);
    }

    parseTransactionStatusByType(status, type = undefined) {
        const statusesByType = {
            'deposit': {
                '0': 'pending',
                '1': 'ok',
                // Fiat
                // Processing, Failed, Successful, Finished, Refunding, Refunded, Refund Failed, Order Partial credit Stopped
                'Processing': 'pending',
                'Failed': 'failed',
                'Successful': 'ok',
                'Refunding': 'canceled',
                'Refunded': 'canceled',
                'Refund Failed': 'failed',
            },
            'withdrawal': {
                '0': 'pending', // Email Sent
                '1': 'canceled', // Cancelled (different from 1 = ok in deposits)
                '2': 'pending', // Awaiting Approval
                '3': 'failed', // Rejected
                '4': 'pending', // Processing
                '5': 'failed', // Failure
                '6': 'ok', // Completed
                // Fiat
                // Processing, Failed, Successful, Finished, Refunding, Refunded, Refund Failed, Order Partial credit Stopped
                'Processing': 'pending',
                'Failed': 'failed',
                'Successful': 'ok',
                'Refunding': 'canceled',
                'Refunded': 'canceled',
                'Refund Failed': 'failed',
            },
        };
        const statuses = this.safeValue(statusesByType, type, {});
        return this.safeString(statuses, status, status);
    }

    parseTransaction(transaction, currency = undefined) {
        const id = this.safeString2(transaction, 'id', 'orderNo');
        const address = this.safeString(transaction, 'address');
        let tag = this.safeString(transaction, 'addressTag'); // set but unused
        if (tag !== undefined) {
            if (tag.length < 1) {
                tag = undefined;
            }
        }
        let txid = this.safeString(transaction, 'txId');
        if ((txid !== undefined) && (txid.indexOf('Internal transfer ') >= 0)) {
            txid = txid.slice(18);
        }
        const currencyId = this.safeString2(transaction, 'coin', 'fiatCurrency');
        const code = this.safeCurrencyCode(currencyId, currency);
        let timestamp = undefined;
        const insertTime = this.safeInteger2(transaction, 'insertTime', 'createTime');
        const applyTime = this.parse8601(this.safeString(transaction, 'applyTime'));
        let type = this.safeString(transaction, 'type');
        if (type === undefined) {
            if ((insertTime !== undefined) && (applyTime === undefined)) {
                type = 'deposit';
                timestamp = insertTime;
            } else if ((insertTime === undefined) && (applyTime !== undefined)) {
                type = 'withdrawal';
                timestamp = applyTime;
            }
        }
        const status = this.parseTransactionStatusByType(this.safeString(transaction, 'status'), type);
        const amount = this.safeNumber(transaction, 'amount');
        const feeCost = this.safeNumber2(transaction, 'transactionFee', 'totalFee');
        let fee = undefined;
        if (feeCost !== undefined) {
            fee = { 'currency': code, 'cost': feeCost };
        }
        const updated = this.safeInteger2(transaction, 'successTime', 'updateTime');
        let internal = this.safeInteger(transaction, 'transferType', false);
        internal = internal ? true : false;
        const network = this.safeString(transaction, 'network');
        return {
            'info': transaction,
            'id': id,
            'txid': txid,
            'timestamp': timestamp,
            'datetime': this.iso8601(timestamp),
            'network': network,
            'address': address,
            'addressTo': address,
            'addressFrom': undefined,
            'tag': tag,
            'tagTo': tag,
            'tagFrom': undefined,
            'type': type,
            'amount': amount,
            'currency': code,
            'status': status,
            'updated': updated,
            'internal': internal,
            'fee': fee,
        };
    }

    parseTransferStatus(status) {
        const statuses = {
            'CONFIRMED': 'ok',
        };
        return this.safeString(statuses, status, status);
    }

    parseTransfer(transfer, currency = undefined) {
        const id = this.safeString(transfer, 'tranId');
        const currencyId = this.safeString(transfer, 'asset');
        const code = this.safeCurrencyCode(currencyId, currency);
        const amount = this.safeNumber(transfer, 'amount');
        const type = this.safeString(transfer, 'type');
        let fromAccount = undefined;
        let toAccount = undefined;
        const typesByAccount = this.safeValue(this.options, 'typesByAccount', {});
        if (type !== undefined) {
            const parts = type.split('_');
            fromAccount = this.safeValue(parts, 0);
            toAccount = this.safeValue(parts, 1);
            fromAccount = this.safeString(typesByAccount, fromAccount, fromAccount);
            toAccount = this.safeString(typesByAccount, toAccount, toAccount);
        }
        const timestamp = this.safeInteger(transfer, 'timestamp');
        const status = this.parseTransferStatus(this.safeString(transfer, 'status'));
        return {
            'info': transfer,
            'id': id,
            'timestamp': timestamp,
            'datetime': this.iso8601(timestamp),
            'currency': code,
            'amount': amount,
            'fromAccount': fromAccount,
            'toAccount': toAccount,
            'status': status,
        };
    }

    parseIncome(income, market = undefined) {
        const marketId = this.safeString(income, 'symbol');
        const symbol = this.safeSymbol(marketId, market);
        const amount = this.safeNumber(income, 'income');
        const currencyId = this.safeString(income, 'asset');
        const code = this.safeCurrencyCode(currencyId);
        const id = this.safeString(income, 'tranId');
        const timestamp = this.safeInteger(income, 'time');
        return {
            'info': income,
            'symbol': symbol,
            'code': code,
            'timestamp': timestamp,
            'datetime': this.iso8601(timestamp),
            'id': id,
            'amount': amount,
        };
    }

    parseIncomes(incomes, market = undefined, since = undefined, limit = undefined) {
        const result = [];
        for (let i = 0; i < incomes.length; i++) {
            const entry = incomes[i];
            const parsed = this.parseIncome(entry, market);
            result.push(parsed);
        }
        const sorted = this.sortBy(result, 'timestamp');
        return this.filterBySinceLimit(sorted, since, limit);
    }

    async transfer(code, amount, fromAccount, toAccount, params = {}) {
        await this.loadMarkets();
        const currency = this.currency(code);
        let type = this.safeString(params, 'type');
        if (type === undefined) {
            const accountsByType = this.safeValue(this.options, 'accountsByType', {});
            fromAccount = fromAccount.toLowerCase();
            toAccount = toAccount.toLowerCase();
            const fromId = this.safeString(accountsByType, fromAccount);
            const toId = this.safeString(accountsByType, toAccount);
            if (fromId === undefined) {
                const keys = Object.keys(accountsByType);
                throw new ExchangeError(this.id + ' fromAccount must be one of ' + keys.join(', '));
            }
            if (toId === undefined) {
                const keys = Object.keys(accountsByType);
                throw new ExchangeError(this.id + ' toAccount must be one of ' + keys.join(', '));
            }
            type = fromId + '_' + toId;
        }
        const request = {
            'asset': currency['id'],
            'amount': this.currencyToPrecision(code, amount),
            'type': type,
        };
        const response = await this.sapiPostAssetTransfer(this.extend(request, params));
        const transfer = this.parseTransfer(response, currency);
        return this.extend(transfer, {
            'amount': amount,
            'currency': code,
            'fromAccount': fromAccount,
            'toAccount': toAccount,
        });
    }

    async fetchTransfers(code = undefined, since = undefined, limit = undefined, params = {}) {
        await this.loadMarkets();
        let currency = undefined;
        if (code !== undefined) {
            currency = this.currency(code);
        }
        const defaultType = this.safeString2(this.options, 'fetchTransfers', 'defaultType', 'spot');
        const fromAccount = this.safeString(params, 'fromAccount', defaultType);
        const defaultTo = (fromAccount === 'future') ? 'spot' : 'future';
        const toAccount = this.safeString(params, 'toAccount', defaultTo);
        let type = this.safeString(params, 'type');
        const accountsByType = this.safeValue(this.options, 'accountsByType', {});
        const fromId = this.safeString(accountsByType, fromAccount);
        const toId = this.safeString(accountsByType, toAccount);
        if (type === undefined) {
            if (fromId === undefined) {
                const keys = Object.keys(accountsByType);
                throw new ExchangeError(this.id + ' fromAccount parameter must be one of ' + keys.join(', '));
            }
            if (toId === undefined) {
                const keys = Object.keys(accountsByType);
                throw new ExchangeError(this.id + ' toAccount parameter must be one of ' + keys.join(', '));
            }
            type = fromId + '_' + toId;
        }
        const request = {
            'type': type,
        };
        if (since !== undefined) {
            request['startTime'] = since;
        }
        if (limit !== undefined) {
            request['size'] = limit;
        }
        const response = await this.sapiGetAssetTransfer(this.extend(request, params));
        const rows = this.safeValue(response, 'rows', []);
        return this.parseTransfers(rows, currency, since, limit);
    }

    async fetchDepositAddress(code, params = {}) {
        await this.loadMarkets();
        const currency = this.currency(code);
        const request = {
            'coin': currency['id']
        };
        const networks = this.safeValue(this.options, 'networks', {});
        let network = this.safeStringUpper(params, 'network'); // this line allows the user to specify either ERC20 or ETH
        network = this.safeString(networks, network, network); // handle ERC20>ETH alias
        if (network !== undefined) {
            request['network'] = network;
            params = this.omit(params, 'network');
        }
        // has support for the 'network' parameter
        // https://liqi-docs.github.io/apidocs/spot/en/#deposit-address-supporting-network-user_data
        const response = await this.sapiGetCapitalDepositAddress(this.extend(request, params));
        const address = this.safeString(response, 'address');
        const url = this.safeString(response, 'url');
        let impliedNetwork = undefined;
        if (url !== undefined) {
            const reverseNetworks = this.safeValue(this.options, 'reverseNetworks', {});
            const parts = url.split('/');
            let topLevel = this.safeString(parts, 2);
            if ((topLevel === 'blockchair.com') || (topLevel === 'viewblock.io')) {
                const subLevel = this.safeString(parts, 3);
                if (subLevel !== undefined) {
                    topLevel = topLevel + '/' + subLevel;
                }
            }
            impliedNetwork = this.safeString(reverseNetworks, topLevel);
            const impliedNetworks = this.safeValue(this.options, 'impliedNetworks', {
                'ETH': { 'ERC20': 'ETH' },
                'TRX': { 'TRC20': 'TRX' },
            });
            if (code in impliedNetworks) {
                const conversion = this.safeValue(impliedNetworks, code, {});
                impliedNetwork = this.safeString(conversion, impliedNetwork, impliedNetwork);
            }
        }
        let tag = this.safeString(response, 'tag', '');
        if (tag.length === 0) {
            tag = undefined;
        }
        this.checkAddress(address);
        return {
            'currency': code,
            'address': address,
            'tag': tag,
            'network': impliedNetwork,
            'info': response,
        };
    }

    async fetchFundingFees(codes = undefined, params = {}) {
        await this.loadMarkets();
        const response = await this.sapiGetCapitalConfigGetall(params);
        const withdrawFees = {};
        for (let i = 0; i < response.length; i++) {
            const entry = response[i];
            const currencyId = this.safeString(entry, 'coin');
            const code = this.safeCurrencyCode(currencyId);
            const networkList = this.safeValue(entry, 'networkList');
            withdrawFees[code] = {};
            for (let j = 0; j < networkList.length; j++) {
                const networkEntry = networkList[j];
                const networkId = this.safeString(networkEntry, 'network');
                const networkCode = this.safeCurrencyCode(networkId);
                const fee = this.safeNumber(networkEntry, 'withdrawFee');
                withdrawFees[code][networkCode] = fee;
            }
        }
        return {
            'withdraw': withdrawFees,
            'deposit': {},
            'info': response,
        };
    }

    async withdraw(code, amount, address, tag = undefined, params = {}) {
        [tag, params] = this.handleWithdrawTagAndParams(tag, params);
        this.checkAddress(address);
        await this.loadMarkets();
        const currency = this.currency(code);
        const request = {
            'coin': currency['id'],
            'address': address,
            'amount': amount
        };
        if (tag !== undefined) {
            request['addressTag'] = tag;
        }
        const networks = this.safeValue(this.options, 'networks', {});
        let network = this.safeStringUpper(params, 'network'); // this line allows the user to specify either ERC20 or ETH
        network = this.safeString(networks, network, network); // handle ERC20>ETH alias
        if (network !== undefined) {
            request['network'] = network;
            params = this.omit(params, 'network');
        }
        const response = await this.sapiPostCapitalWithdrawApply(this.extend(request, params));
        return {
            'info': response,
            'id': this.safeString(response, 'id'),
        };
    }

    parseTradingFee(fee, market = undefined) {
        const marketId = this.safeString(fee, 'symbol');
        const symbol = this.safeSymbol(marketId);
        return {
            'info': fee,
            'symbol': symbol,
            'maker': this.safeNumber(fee, 'makerCommission'),
            'taker': this.safeNumber(fee, 'takerCommission'),
        };
    }

    async fetchTradingFee(symbol, params = {}) {
        await this.loadMarkets();
        const market = this.market(symbol);
        const request = {
            'symbol': market['id'],
        };
        const response = await this.sapiGetAssetTradeFee(this.extend(request, params));
        const first = this.safeValue(response, 0, {});
        return this.parseTradingFee(first);
    }

    async fetchTradingFees(params = {}) {
        await this.loadMarkets();
        let method = undefined;
        const defaultType = this.safeString2(this.options, 'fetchFundingRates', 'defaultType', 'future');
        const type = this.safeString(params, 'type', defaultType);
        const query = this.omit(params, 'type');
        if ((type === 'spot') || (type === 'margin')) {
            method = 'sapiGetAssetTradeFee';
        } else if (type === 'future') {
            method = 'fapiPrivateGetAccount';
        } else if (type === 'delivery') {
            method = 'dapiPrivateGetAccount';
        }
        const response = await this[method](query);

        if ((type === 'spot') || (type === 'margin')) {
            const result = {};
            for (let i = 0; i < response.length; i++) {
                const fee = this.parseTradingFee(response[i]);
                const symbol = fee['symbol'];
                result[symbol] = fee;
            }
            return result;
        } else if (type === 'future') {
            const symbols = Object.keys(this.markets);
            const result = {};
            const feeTier = this.safeInteger(response, 'feeTier');
            const feeTiers = this.fees[type]['trading']['tiers'];
            const maker = feeTiers['maker'][feeTier][1];
            const taker = feeTiers['taker'][feeTier][1];
            for (let i = 0; i < symbols.length; i++) {
                const symbol = symbols[i];
                result[symbol] = {
                    'info': {
                        'feeTier': feeTier,
                    },
                    'symbol': symbol,
                    'maker': maker,
                    'taker': taker,
                };
            }
            return result;
        } else if (type === 'delivery') {
            const symbols = Object.keys(this.markets);
            const result = {};
            const feeTier = this.safeInteger(response, 'feeTier');
            const feeTiers = this.fees[type]['trading']['tiers'];
            const maker = feeTiers['maker'][feeTier][1];
            const taker = feeTiers['taker'][feeTier][1];
            for (let i = 0; i < symbols.length; i++) {
                const symbol = symbols[i];
                result[symbol] = {
                    'info': {
                        'feeTier': feeTier,
                    },
                    'symbol': symbol,
                    'maker': maker,
                    'taker': taker,
                };
            }
            return result;
        }
    }

    async futuresTransfer(code, amount, type, params = {}) {
        if ((type < 1) || (type > 4)) {
            throw new ArgumentsRequired(this.id + ' type must be between 1 and 4');
        }
        await this.loadMarkets();
        const currency = this.currency(code);
        const request = {
            'asset': currency['id'],
            'amount': amount,
            'type': type,
        };
        const response = await this.sapiPostFuturesTransfer(this.extend(request, params));
        return this.parseTransfer(response, currency);
    }

    async fetchFundingRate(symbol, params = {}) {
        await this.loadMarkets();
        const market = this.market(symbol);
        const request = {
            'symbol': market['id'],
        };
        let method = undefined;
        if (market['linear']) {
            method = 'fapiPublicGetPremiumIndex';
        } else if (market['inverse']) {
            method = 'dapiPublicGetPremiumIndex';
        } else {
            throw new NotSupported(this.id + ' fetchFundingRate() supports linear and inverse contracts only');
        }
        let response = await this[method](this.extend(request, params));
        if (market['inverse']) {
            response = response[0];
        }
        return this.parseFundingRate(response, market);
    }

    async fetchFundingRateHistory(symbol = undefined, since = undefined, limit = undefined, params = {}) {
        await this.loadMarkets();
        const request = {};
        let method = undefined;
        const defaultType = this.safeString2(this.options, 'fetchFundingRateHistory', 'defaultType', 'future');
        const type = this.safeString(params, 'type', defaultType);
        params = this.omit(params, 'type');
        if (type === 'future') {
            method = 'fapiPublicGetFundingRate';
        } else if (type === 'delivery') {
            method = 'dapiPublicGetFundingRate';
        }
        if (symbol !== undefined) {
            const market = this.market(symbol);
            symbol = market['symbol'];
            request['symbol'] = market['id'];
            if (market['linear']) {
                method = 'fapiPublicGetFundingRate';
            } else if (market['inverse']) {
                method = 'dapiPublicGetFundingRate';
            }
        }
        if (method === undefined) {
            throw new NotSupported(this.id + ' fetchFundingRateHistory() not supported for ' + type + ' markets');
        }
        if (since !== undefined) {
            request['startTime'] = since;
        }
        const till = this.safeInteger(params, 'till'); // unified in milliseconds
        const endTime = this.safeString(params, 'endTime', till); // exchange-specific in milliseconds
        params = this.omit(params, ['endTime', 'till']);
        if (endTime !== undefined) {
            request['endTime'] = endTime;
        }
        if (limit !== undefined) {
            request['limit'] = limit;
        }
        const response = await this[method](this.extend(request, params));
        const rates = [];
        for (let i = 0; i < response.length; i++) {
            const entry = response[i];
            const timestamp = this.safeInteger(entry, 'fundingTime');
            rates.push({
                'info': entry,
                'symbol': this.safeSymbol(this.safeString(entry, 'symbol')),
                'fundingRate': this.safeNumber(entry, 'fundingRate'),
                'timestamp': timestamp,
                'datetime': this.iso8601(timestamp),
            });
        }
        const sorted = this.sortBy(rates, 'timestamp');
        return this.filterBySymbolSinceLimit(sorted, symbol, since, limit);
    }

    async fetchFundingRates(symbols = undefined, params = {}) {
        await this.loadMarkets();
        let method = undefined;
        const defaultType = this.safeString2(this.options, 'fetchFundingRates', 'defaultType', 'future');
        const type = this.safeString(params, 'type', defaultType);
        const query = this.omit(params, 'type');
        if (type === 'future') {
            method = 'fapiPublicGetPremiumIndex';
        } else if (type === 'delivery') {
            method = 'dapiPublicGetPremiumIndex';
        } else {
            throw new NotSupported(this.id + ' fetchFundingRates() supports linear and inverse contracts only');
        }
        const response = await this[method](query);
        const result = [];
        for (let i = 0; i < response.length; i++) {
            const entry = response[i];
            const parsed = this.parseFundingRate(entry);
            result.push(parsed);
        }
        return this.filterByArray(result, 'symbol', symbols);
    }

    parseFundingRate(premiumIndex, market = undefined) {
        const timestamp = this.safeInteger(premiumIndex, 'time');
        const marketId = this.safeString(premiumIndex, 'symbol');
        const symbol = this.safeSymbol(marketId, market);
        const markPrice = this.safeNumber(premiumIndex, 'markPrice');
        const indexPrice = this.safeNumber(premiumIndex, 'indexPrice');
        const interestRate = this.safeNumber(premiumIndex, 'interestRate');
        const estimatedSettlePrice = this.safeNumber(premiumIndex, 'estimatedSettlePrice');
        const fundingRate = this.safeNumber(premiumIndex, 'lastFundingRate');
        const fundingTime = this.safeInteger(premiumIndex, 'nextFundingTime');
        return {
            'info': premiumIndex,
            'symbol': symbol,
            'markPrice': markPrice,
            'indexPrice': indexPrice,
            'interestRate': interestRate,
            'estimatedSettlePrice': estimatedSettlePrice,
            'timestamp': timestamp,
            'datetime': this.iso8601(timestamp),
            'fundingRate': fundingRate,
            'fundingTimestamp': fundingTime,
            'fundingDatetime': this.iso8601(fundingTime),
            'nextFundingRate': undefined,
            'nextFundingTimestamp': undefined,
            'nextFundingDatetime': undefined,
            'previousFundingRate': undefined,
            'previousFundingTimestamp': undefined,
            'previousFundingDatetime': undefined,
        };
    }

    parseAccountPositions(account) {
        const positions = this.safeValue(account, 'positions');
        const assets = this.safeValue(account, 'assets');
        const balances = {};
        for (let i = 0; i < assets.length; i++) {
            const entry = assets[i];
            const currencyId = this.safeString(entry, 'asset');
            const code = this.safeCurrencyCode(currencyId);
            const crossWalletBalance = this.safeString(entry, 'crossWalletBalance');
            const crossUnPnl = this.safeString(entry, 'crossUnPnl');
            balances[code] = {
                'crossMargin': Precise.stringAdd(crossWalletBalance, crossUnPnl),
                'crossWalletBalance': crossWalletBalance,
            };
        }
        const result = [];
        for (let i = 0; i < positions.length; i++) {
            const position = positions[i];
            const marketId = this.safeString(position, 'symbol');
            const market = this.safeMarket(marketId);
            const code = (this.options['defaultType'] === 'future') ? market['quote'] : market['base'];
            // sometimes not all the codes are correctly returned...
            if (code in balances) {
                const parsed = this.parseAccountPosition(this.extend(position, {
                    'crossMargin': balances[code]['crossMargin'],
                    'crossWalletBalance': balances[code]['crossWalletBalance'],
                }), market);
                result.push(parsed);
            }
        }
        return result;
    }

    parseAccountPosition(position, market = undefined) {
        const marketId = this.safeString(position, 'symbol');
        market = this.safeMarket(marketId, market);
        const symbol = this.safeString(market, 'symbol');
        const leverageString = this.safeString(position, 'leverage');
        const leverage = parseInt(leverageString);
        const initialMarginString = this.safeString(position, 'initialMargin');
        const initialMargin = this.parseNumber(initialMarginString);
        let initialMarginPercentageString = Precise.stringDiv('1', leverageString, 8);
        const rational = (1000 % leverage) === 0;
        if (!rational) {
            initialMarginPercentageString = Precise.stringDiv(Precise.stringAdd(initialMarginPercentageString, '1e-8'), '1', 8);
        }
        const usdm = ('notional' in position);
        const maintenanceMarginString = this.safeString(position, 'maintMargin');
        const maintenanceMargin = this.parseNumber(maintenanceMarginString);
        const entryPriceString = this.safeString(position, 'entryPrice');
        let entryPrice = this.parseNumber(entryPriceString);
        const notionalString = this.safeString2(position, 'notional', 'notionalValue');
        const notionalStringAbs = Precise.stringAbs(notionalString);
        const notional = this.parseNumber(notionalStringAbs);
        let contractsString = this.safeString(position, 'positionAmt');
        let contractsStringAbs = Precise.stringAbs(contractsString);
        if (contractsString === undefined) {
            const entryNotional = Precise.stringMul(Precise.stringMul(leverageString, initialMarginString), entryPriceString);
            const contractSize = this.safeString(market, 'contractSize');
            contractsString = Precise.stringDiv(entryNotional, contractSize);
            contractsStringAbs = Precise.stringDiv(Precise.stringAdd(contractsString, '0.5'), '1', 0);
        }
        const contracts = this.parseNumber(contractsStringAbs);
        const leverageBrackets = this.safeValue(this.options, 'leverageBrackets', {});
        const leverageBracket = this.safeValue(leverageBrackets, symbol, []);
        let maintenanceMarginPercentageString = undefined;
        for (let i = 0; i < leverageBracket.length; i++) {
            const bracket = leverageBracket[i];
            if (Precise.stringLt(notionalStringAbs, bracket[0])) {
                break;
            }
            maintenanceMarginPercentageString = bracket[1];
        }
        const maintenanceMarginPercentage = this.parseNumber(maintenanceMarginPercentageString);
        const unrealizedPnlString = this.safeString(position, 'unrealizedProfit');
        const unrealizedPnl = this.parseNumber(unrealizedPnlString);
        let timestamp = this.safeInteger(position, 'updateTime');
        if (timestamp === 0) {
            timestamp = undefined;
        }
        const isolated = this.safeValue(position, 'isolated');
        let marginType = undefined;
        let collateralString = undefined;
        let walletBalance = undefined;
        if (isolated) {
            marginType = 'isolated';
            walletBalance = this.safeString(position, 'isolatedWallet');
            collateralString = Precise.stringAdd(walletBalance, unrealizedPnlString);
        } else {
            marginType = 'cross';
            walletBalance = this.safeString(position, 'crossWalletBalance');
            collateralString = this.safeString(position, 'crossMargin');
        }
        const collateral = this.parseNumber(collateralString);
        let marginRatio = undefined;
        let side = undefined;
        let percentage = undefined;
        let liquidationPriceStringRaw = undefined;
        let liquidationPrice = undefined;
        const contractSize = this.safeValue(market, 'contractSize');
        const contractSizeString = this.numberToString(contractSize);
        if (Precise.stringEquals(notionalString, '0')) {
            entryPrice = undefined;
        } else {
            side = Precise.stringLt(notionalString, '0') ? 'short' : 'long';
            marginRatio = this.parseNumber(Precise.stringDiv(Precise.stringAdd(Precise.stringDiv(maintenanceMarginString, collateralString), '5e-5'), '1', 4));
            percentage = this.parseNumber(Precise.stringMul(Precise.stringDiv(unrealizedPnlString, initialMarginString, 4), '100'));
            if (usdm) {
                let onePlusMaintenanceMarginPercentageString = undefined;
                let entryPriceSignString = entryPriceString;
                if (side === 'short') {
                    onePlusMaintenanceMarginPercentageString = Precise.stringAdd('1', maintenanceMarginPercentageString);
                } else {
                    onePlusMaintenanceMarginPercentageString = Precise.stringAdd('-1', maintenanceMarginPercentageString);
                    entryPriceSignString = Precise.stringMul('-1', entryPriceSignString);
                }
                const leftSide = Precise.stringDiv(walletBalance, Precise.stringMul(contractsStringAbs, onePlusMaintenanceMarginPercentageString));
                const rightSide = Precise.stringDiv(entryPriceSignString, onePlusMaintenanceMarginPercentageString);
                liquidationPriceStringRaw = Precise.stringAdd(leftSide, rightSide);
            } else {
                let onePlusMaintenanceMarginPercentageString = undefined;
                let entryPriceSignString = entryPriceString;
                if (side === 'short') {
                    onePlusMaintenanceMarginPercentageString = Precise.stringSub('1', maintenanceMarginPercentageString);
                } else {
                    onePlusMaintenanceMarginPercentageString = Precise.stringSub('-1', maintenanceMarginPercentageString);
                    entryPriceSignString = Precise.stringMul('-1', entryPriceSignString);
                }
                const size = Precise.stringMul(contractsStringAbs, contractSizeString);
                const leftSide = Precise.stringMul(size, onePlusMaintenanceMarginPercentageString);
                const rightSide = Precise.stringSub(Precise.stringMul(Precise.stringDiv('1', entryPriceSignString), size), walletBalance);
                liquidationPriceStringRaw = Precise.stringDiv(leftSide, rightSide);
            }
            const pricePrecision = market['precision']['price'];
            const pricePrecisionPlusOne = pricePrecision + 1;
            const pricePrecisionPlusOneString = pricePrecisionPlusOne.toString();
            const rounder = new Precise('5e-' + pricePrecisionPlusOneString);
            const rounderString = rounder.toString();
            const liquidationPriceRoundedString = Precise.stringAdd(rounderString, liquidationPriceStringRaw);
            let truncatedLiquidationPrice = Precise.stringDiv(liquidationPriceRoundedString, '1', pricePrecision);
            if (truncatedLiquidationPrice[0] === '-') {
                truncatedLiquidationPrice = undefined;
            }
            liquidationPrice = this.parseNumber(truncatedLiquidationPrice);
        }
        const positionSide = this.safeString(position, 'positionSide');
        const hedged = positionSide !== 'BOTH';
        return {
            'info': position,
            'symbol': symbol,
            'timestamp': timestamp,
            'datetime': this.iso8601(timestamp),
            'initialMargin': initialMargin,
            'initialMarginPercentage': this.parseNumber(initialMarginPercentageString),
            'maintenanceMargin': maintenanceMargin,
            'maintenanceMarginPercentage': maintenanceMarginPercentage,
            'entryPrice': entryPrice,
            'notional': notional,
            'leverage': this.parseNumber(leverageString),
            'unrealizedPnl': unrealizedPnl,
            'contracts': contracts,
            'contractSize': contractSize,
            'marginRatio': marginRatio,
            'liquidationPrice': liquidationPrice,
            'markPrice': undefined,
            'collateral': collateral,
            'marginType': marginType,
            'side': side,
            'hedged': hedged,
            'percentage': percentage,
        };
    }

    parsePositionRisk(position, market = undefined) {
        const marketId = this.safeString(position, 'symbol');
        market = this.safeMarket(marketId, market);
        const symbol = this.safeString(market, 'symbol');
        const leverageBrackets = this.safeValue(this.options, 'leverageBrackets', {});
        const leverageBracket = this.safeValue(leverageBrackets, symbol, []);
        const notionalString = this.safeString2(position, 'notional', 'notionalValue');
        const notionalStringAbs = Precise.stringAbs(notionalString);
        let maintenanceMarginPercentageString = undefined;
        for (let i = 0; i < leverageBracket.length; i++) {
            const bracket = leverageBracket[i];
            if (Precise.stringLt(notionalStringAbs, bracket[0])) {
                break;
            }
            maintenanceMarginPercentageString = bracket[1];
        }
        const notional = this.parseNumber(notionalStringAbs);
        const contractsAbs = Precise.stringAbs(this.safeString(position, 'positionAmt'));
        const contracts = this.parseNumber(contractsAbs);
        const unrealizedPnlString = this.safeString(position, 'unRealizedProfit');
        const unrealizedPnl = this.parseNumber(unrealizedPnlString);
        const leverageString = this.safeString(position, 'leverage');
        const leverage = parseInt(leverageString);
        const liquidationPriceString = this.omitZero(this.safeString(position, 'liquidationPrice'));
        const liquidationPrice = this.parseNumber(liquidationPriceString);
        let collateralString = undefined;
        const marginType = this.safeString(position, 'marginType');
        let side = undefined;
        if (Precise.stringGt(notionalString, '0')) {
            side = 'long';
        } else if (Precise.stringLt(notionalString, '0')) {
            side = 'short';
        }
        const entryPriceString = this.safeString(position, 'entryPrice');
        const entryPrice = this.parseNumber(entryPriceString);
        const contractSize = this.safeValue(market, 'contractSize');
        const contractSizeString = this.numberToString(contractSize);
        // as oppose to notionalValue
        const linear = ('notional' in position);
        if (marginType === 'cross') {
            // calculate collateral
            const precision = this.safeValue(market, 'precision');
            if (linear) {
                // walletBalance = (liquidationPrice * (±1 + mmp) ± entryPrice) * contracts
                let onePlusMaintenanceMarginPercentageString = undefined;
                let entryPriceSignString = entryPriceString;
                if (side === 'short') {
                    onePlusMaintenanceMarginPercentageString = Precise.stringAdd('1', maintenanceMarginPercentageString);
                    entryPriceSignString = Precise.stringMul('-1', entryPriceSignString);
                } else {
                    onePlusMaintenanceMarginPercentageString = Precise.stringAdd('-1', maintenanceMarginPercentageString);
                }
                const inner = Precise.stringMul(liquidationPriceString, onePlusMaintenanceMarginPercentageString);
                const leftSide = Precise.stringAdd(inner, entryPriceSignString);
                const quotePrecision = this.safeInteger(precision, 'quote');
                collateralString = Precise.stringDiv(Precise.stringMul(leftSide, contractsAbs), '1', quotePrecision);
            } else {
                // walletBalance = (contracts * contractSize) * (±1/entryPrice - (±1 - mmp) / liquidationPrice)
                let onePlusMaintenanceMarginPercentageString = undefined;
                let entryPriceSignString = entryPriceString;
                if (side === 'short') {
                    onePlusMaintenanceMarginPercentageString = Precise.stringSub('1', maintenanceMarginPercentageString);
                } else {
                    onePlusMaintenanceMarginPercentageString = Precise.stringSub('-1', maintenanceMarginPercentageString);
                    entryPriceSignString = Precise.stringMul('-1', entryPriceSignString);
                }
                const leftSide = Precise.stringMul(contractsAbs, contractSizeString);
                const rightSide = Precise.stringSub(Precise.stringDiv('1', entryPriceSignString), Precise.stringDiv(onePlusMaintenanceMarginPercentageString, liquidationPriceString));
                const basePrecision = this.safeInteger(precision, 'base');
                collateralString = Precise.stringDiv(Precise.stringMul(leftSide, rightSide), '1', basePrecision);
            }
        } else {
            collateralString = this.safeString(position, 'isolatedMargin');
        }
        collateralString = (collateralString === undefined) ? '0' : collateralString;
        const collateral = this.parseNumber(collateralString);
        const markPrice = this.parseNumber(this.omitZero(this.safeString(position, 'markPrice')));
        let timestamp = this.safeInteger(position, 'updateTime');
        if (timestamp === 0) {
            timestamp = undefined;
        }
        const maintenanceMarginPercentage = this.parseNumber(maintenanceMarginPercentageString);
        const maintenanceMarginString = Precise.stringMul(maintenanceMarginPercentageString, notionalStringAbs);
        const maintenanceMargin = this.parseNumber(maintenanceMarginString);
        let initialMarginPercentageString = Precise.stringDiv('1', leverageString, 8);
        const rational = (1000 % leverage) === 0;
        if (!rational) {
            initialMarginPercentageString = Precise.stringAdd(initialMarginPercentageString, '1e-8');
        }
        const initialMarginString = Precise.stringDiv(Precise.stringMul(notionalStringAbs, initialMarginPercentageString), '1', 8);
        const initialMargin = this.parseNumber(initialMarginString);
        let marginRatio = undefined;
        let percentage = undefined;
        if (!Precise.stringEquals(collateralString, '0')) {
            marginRatio = this.parseNumber(Precise.stringDiv(Precise.stringAdd(Precise.stringDiv(maintenanceMarginString, collateralString), '5e-5'), '1', 4));
            percentage = this.parseNumber(Precise.stringMul(Precise.stringDiv(unrealizedPnlString, initialMarginString, 4), '100'));
        }
        const positionSide = this.safeString(position, 'positionSide');
        const hedged = positionSide !== 'BOTH';
        return {
            'info': position,
            'symbol': symbol,
            'contracts': contracts,
            'contractSize': contractSize,
            'unrealizedPnl': unrealizedPnl,
            'leverage': this.parseNumber(leverageString),
            'liquidationPrice': liquidationPrice,
            'collateral': collateral,
            'notional': notional,
            'markPrice': markPrice,
            'entryPrice': entryPrice,
            'timestamp': timestamp,
            'initialMargin': initialMargin,
            'initialMarginPercentage': this.parseNumber(initialMarginPercentageString),
            'maintenanceMargin': maintenanceMargin,
            'maintenanceMarginPercentage': maintenanceMarginPercentage,
            'marginRatio': marginRatio,
            'datetime': this.iso8601(timestamp),
            'marginType': marginType,
            'side': side,
            'hedged': hedged,
            'percentage': percentage,
        };
    }

    async loadLeverageBrackets(reload = false, params = {}) {
        await this.loadMarkets();
        const leverageBrackets = this.safeValue(this.options, 'leverageBrackets');
        if ((leverageBrackets === undefined) || (reload)) {
            let method = undefined;
            const defaultType = this.safeString(this.options, 'defaultType', 'future');
            const type = this.safeString(params, 'type', defaultType);
            const query = this.omit(params, 'type');
            if (type === 'future') {
                method = 'fapiPrivateGetLeverageBracket';
            } else if (type === 'delivery') {
                method = 'dapiPrivateV2GetLeverageBracket';
            } else {
                throw new NotSupported(this.id + ' loadLeverageBrackets() supports linear and inverse contracts only');
            }
            const response = await this[method](query);
            this.options['leverageBrackets'] = {};
            for (let i = 0; i < response.length; i++) {
                const entry = response[i];
                const marketId = this.safeString(entry, 'symbol');
                const symbol = this.safeSymbol(marketId);
                const brackets = this.safeValue(entry, 'brackets');
                const result = [];
                for (let j = 0; j < brackets.length; j++) {
                    const bracket = brackets[j];
                    const floorValue = this.safeString2(bracket, 'notionalFloor', 'qtyFloor');
                    const maintenanceMarginPercentage = this.safeString(bracket, 'maintMarginRatio');
                    result.push([floorValue, maintenanceMarginPercentage]);
                }
                this.options['leverageBrackets'][symbol] = result;
            }
        }
        return this.options['leverageBrackets'];
    }

    async fetchLeverageTiers(symbols = undefined, params = {}) {
        await this.loadMarkets();
        const [type, query] = this.handleMarketTypeAndParams('fetchLeverageTiers', undefined, params);
        let method = undefined;
        if (type === 'future') {
            method = 'fapiPrivateGetLeverageBracket';
        } else if (type === 'delivery') {
            method = 'dapiPrivateV2GetLeverageBracket';
        } else {
            throw new NotSupported(this.id + ' fetchLeverageTiers() supports linear and inverse contracts only');
        }
        const response = await this[method](query);
        return this.parseLeverageTiers(response, symbols, 'symbol');
    }

    parseMarketLeverageTiers(info, market) {
        /**
            @param info: Exchange response for 1 market
            {
                "symbol": "SUSHIUSDT",
                "brackets": [
                    {
                        "bracket": 1,
                        "initialLeverage": 50,
                        "notionalCap": 50000,
                        "notionalFloor": 0,
                        "maintMarginRatio": 0.01,
                        "cum": 0.0
                    },
                    ...
                ]
            }
            @param market: CCXT market
        */
        const marketId = this.safeString(info, 'symbol');
        const safeSymbol = this.safeSymbol(marketId);
        market = this.safeMarket(safeSymbol, market);
        const brackets = this.safeValue(info, 'brackets');
        const tiers = [];
        for (let j = 0; j < brackets.length; j++) {
            const bracket = brackets[j];
            tiers.push({
                'tier': this.safeNumber(bracket, 'bracket'),
                'currency': market['quote'],
                'notionalFloor': this.safeNumber2(bracket, 'notionalFloor', 'qtyFloor'),
                'notionalCap': this.safeNumber(bracket, 'notionalCap'),
                'maintenanceMarginRate': this.safeNumber(bracket, 'maintMarginRatio'),
                'maxLeverage': this.safeNumber(bracket, 'initialLeverage'),
                'info': bracket,
            });
        }
        return tiers;
    }

    async fetchPositions(symbols = undefined, params = {}) {
        const defaultMethod = this.safeString(this.options, 'fetchPositions', 'positionRisk');
        if (defaultMethod === 'positionRisk') {
            return await this.fetchPositionsRisk(symbols, params);
        } else if (defaultMethod === 'account') {
            return await this.fetchAccountPositions(symbols, params);
        } else {
            throw new NotSupported(this.id + '.options["fetchPositions"] = "' + defaultMethod + '" is invalid, please choose between "account" and "positionRisk"');
        }
    }

    async fetchAccountPositions(symbols = undefined, params = {}) {
        if (symbols !== undefined) {
            if (!Array.isArray(symbols)) {
                throw new ArgumentsRequired(this.id + ' fetchPositions requires an array argument for symbols');
            }
        }
        await this.loadMarkets();
        await this.loadLeverageBrackets();
        let method = undefined;
        const defaultType = this.safeString(this.options, 'defaultType', 'future');
        const type = this.safeString(params, 'type', defaultType);
        const query = this.omit(params, 'type');
        if (type === 'future') {
            method = 'fapiPrivateGetAccount';
        } else if (type === 'delivery') {
            method = 'dapiPrivateGetAccount';
        } else {
            throw new NotSupported(this.id + ' fetchPositions() supports linear and inverse contracts only');
        }
        const account = await this[method](query);
        const result = this.parseAccountPositions(account);
        return this.filterByArray(result, 'symbol', symbols, false);
    }

    async fetchPositionsRisk(symbols = undefined, params = {}) {
        if (symbols !== undefined) {
            if (!Array.isArray(symbols)) {
                throw new ArgumentsRequired(this.id + ' fetchPositionsRisk requires an array argument for symbols');
            }
        }
        await this.loadMarkets();
        await this.loadLeverageBrackets();
        const request = {};
        let method = undefined;
        let defaultType = 'future';
        defaultType = this.safeString(this.options, 'defaultType', defaultType);
        const type = this.safeString(params, 'type', defaultType);
        params = this.omit(params, 'type');
        if ((type === 'future') || (type === 'linear')) {
            method = 'fapiPrivateGetPositionRisk';
        } else if ((type === 'delivery') || (type === 'inverse')) {
            method = 'dapiPrivateGetPositionRisk';
        } else {
            throw NotSupported(this.id + ' fetchPositionsRisk() supports linear and inverse contracts only');
        }
        const response = await this[method](this.extend(request, params));
        const result = [];
        for (let i = 0; i < response.length; i++) {
            const parsed = this.parsePositionRisk(response[i]);
            result.push(parsed);
        }
        return this.filterByArray(result, 'symbol', symbols, false);
    }

    async fetchFundingHistory(symbol = undefined, since = undefined, limit = undefined, params = {}) {
        await this.loadMarkets();
        let market = undefined;
        let method = undefined;
        let defaultType = 'future';
        const request = {
            'incomeType': 'FUNDING_FEE', // "TRANSFER"，"WELCOME_BONUS", "REALIZED_PNL"，"FUNDING_FEE", "COMMISSION" and "INSURANCE_CLEAR"
        };
        if (symbol !== undefined) {
            market = this.market(symbol);
            request['symbol'] = market['id'];
            if (market['linear']) {
                defaultType = 'future';
            } else if (market['inverse']) {
                defaultType = 'delivery';
            } else {
                throw NotSupported(this.id + ' fetchFundingHistory() supports linear and inverse contracts only');
            }
        }
        if (since !== undefined) {
            request['startTime'] = since;
        }
        if (limit !== undefined) {
            request['limit'] = limit;
        }
        defaultType = this.safeString2(this.options, 'fetchFundingHistory', 'defaultType', defaultType);
        const type = this.safeString(params, 'type', defaultType);
        params = this.omit(params, 'type');
        if ((type === 'future') || (type === 'linear')) {
            method = 'fapiPrivateGetIncome';
        } else if ((type === 'delivery') || (type === 'inverse')) {
            method = 'dapiPrivateGetIncome';
        } else {
            throw NotSupported(this.id + ' fetchFundingHistory() supports linear and inverse contracts only');
        }
        const response = await this[method](this.extend(request, params));
        return this.parseIncomes(response, market, since, limit);
    }

    async setLeverage(leverage, symbol = undefined, params = {}) {
        if (symbol === undefined) {
            throw new ArgumentsRequired(this.id + ' setLeverage() requires a symbol argument');
        }
        // WARNING: THIS WILL INCREASE LIQUIDATION PRICE FOR OPEN ISOLATED LONG POSITIONS
        // AND DECREASE LIQUIDATION PRICE FOR OPEN ISOLATED SHORT POSITIONS
        if ((leverage < 1) || (leverage > 125)) {
            throw new BadRequest(this.id + ' leverage should be between 1 and 125');
        }
        await this.loadMarkets();
        const market = this.market(symbol);
        let method = undefined;
        if (market['linear']) {
            method = 'fapiPrivatePostLeverage';
        } else if (market['inverse']) {
            method = 'dapiPrivatePostLeverage';
        } else {
            throw new NotSupported(this.id + ' setLeverage() supports linear and inverse contracts only');
        }
        const request = {
            'symbol': market['id'],
            'leverage': leverage,
        };
        return await this[method](this.extend(request, params));
    }

    async setMarginMode(marginType, symbol = undefined, params = {}) {
        if (symbol === undefined) {
            throw new ArgumentsRequired(this.id + ' setMarginMode() requires a symbol argument');
        }
        marginType = marginType.toUpperCase();
        if (marginType === 'CROSS') {
            marginType = 'CROSSED';
        }
        if ((marginType !== 'ISOLATED') && (marginType !== 'CROSSED')) {
            throw new BadRequest(this.id + ' marginType must be either isolated or cross');
        }
        await this.loadMarkets();
        const market = this.market(symbol);
        let method = undefined;
        if (market['linear']) {
            method = 'fapiPrivatePostMarginType';
        } else if (market['inverse']) {
            method = 'dapiPrivatePostMarginType';
        } else {
            throw new NotSupported(this.id + ' setMarginMode() supports linear and inverse contracts only');
        }
        const request = {
            'symbol': market['id'],
            'marginType': marginType,
        };
        let response = undefined;
        try {
            response = await this[method](this.extend(request, params));
        } catch (e) {
            if (e instanceof MarginModeAlreadySet) {
                const throwMarginModeAlreadySet = this.safeValue(this.options, 'throwMarginModeAlreadySet', false);
                if (throwMarginModeAlreadySet) {
                    throw e;
                } else {
                    response = { 'code': -4046, 'msg': 'No need to change margin type.' };
                }
            }
        }
        return response;
    }

    async setPositionMode(hedged, symbol = undefined, params = {}) {
        const defaultType = this.safeString(this.options, 'defaultType', 'future');
        const type = this.safeString(params, 'type', defaultType);
        params = this.omit(params, ['type']);
        let dualSidePosition = undefined;
        if (hedged) {
            dualSidePosition = 'true';
        } else {
            dualSidePosition = 'false';
        }
        const request = {
            'dualSidePosition': dualSidePosition,
        };
        let method = undefined;
        if (type === 'delivery') {
            method = 'dapiPrivatePostPositionSideDual';
        } else {
            method = 'fapiPrivatePostPositionSideDual';
        }
        return await this[method](this.extend(request, params));
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

        headers = { ...headers, cookie: `incap_ses_1235_2761709=xWhCYUWPQ0CtZw9Ek5ojEbALeWIAAAAAojUnhwR0fdyp0WhweDNH4A==;` };

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

    calculateRateLimiterCost(api, method, path, params, config = {}, context = {}) {
        if (('noCoin' in config) && !('coin' in params)) {
            return config['noCoin'];
        } else if (('noSymbol' in config) && !('symbol' in params)) {
            return config['noSymbol'];
        } else if (('noPoolId' in config) && !('poolId' in params)) {
            return config['noPoolId'];
        } else if (('byLimit' in config) && ('limit' in params)) {
            const limit = params['limit'];
            const byLimit = config['byLimit'];
            for (let i = 0; i < byLimit.length; i++) {
                const entry = byLimit[i];
                if (limit <= entry[0]) {
                    return entry[1];
                }
            }
        }
        return this.safeInteger(config, 'cost', 1);
    }

    async request(path, api = 'public', method = 'GET', params = {}, headers = undefined, body = undefined, config = {}, context = {}) {
        const response = await this.fetch2(path, api, method, params, headers, body, config, context);
        // a workaround for {"code":-2015,"msg":"Invalid API-key, IP, or permissions for action."}
        if ((api === 'private') || (api === 'wapi')) {
            this.options['hasAlreadyAuthenticatedSuccessfully'] = true;
        }
        return response;
    }

    async modifyMarginHelper(symbol, amount, addOrReduce, params = {}) {
        // used to modify isolated positions
        let defaultType = this.safeString(this.options, 'defaultType', 'future');
        if (defaultType === 'spot') {
            defaultType = 'future';
        }
        const type = this.safeString(params, 'type', defaultType);
        if ((type === 'margin') || (type === 'spot')) {
            throw new NotSupported(this.id + ' add / reduce margin only supported with type future or delivery');
        }
        await this.loadMarkets();
        const market = this.market(symbol);
        const request = {
            'type': addOrReduce,
            'symbol': market['id'],
            'amount': amount,
        };
        let method = undefined;
        let code = undefined;
        if (type === 'future') {
            method = 'fapiPrivatePostPositionMargin';
            code = market['quote'];
        } else {
            method = 'dapiPrivatePostPositionMargin';
            code = market['base'];
        }
        const response = await this[method](this.extend(request, params));
        const rawType = this.safeInteger(response, 'type');
        const resultType = (rawType === 1) ? 'add' : 'reduce';
        const resultAmount = this.safeNumber(response, 'amount');
        const errorCode = this.safeString(response, 'code');
        const status = (errorCode === '200') ? 'ok' : 'failed';
        return {
            'info': response,
            'type': resultType,
            'amount': resultAmount,
            'code': code,
            'symbol': market['symbol'],
            'status': status,
        };
    }

    async reduceMargin(symbol, amount, params = {}) {
        return await this.modifyMarginHelper(symbol, amount, 2, params);
    }

    async addMargin(symbol, amount, params = {}) {
        return await this.modifyMarginHelper(symbol, amount, 1, params);
    }

    async fetchBorrowRate(code, params = {}) {
        await this.loadMarkets();
        const currency = this.currency(code);
        const request = {
            'asset': currency['id']
        };
        const response = await this.sapiGetMarginInterestRateHistory(this.extend(request, params));
        const rate = this.safeValue(response, 0);
        const timestamp = this.safeNumber(rate, 'timestamp');
        return {
            'currency': code,
            'rate': this.safeNumber(rate, 'dailyInterestRate'),
            'period': 86400000,
            'timestamp': timestamp,
            'datetime': this.iso8601(timestamp),
            'info': response,
        };
    }

    async fetchBorrowRateHistory(code, since = undefined, limit = undefined, params = {}) {
        await this.loadMarkets();
        if (limit === undefined) {
            limit = 93;
        } else if (limit > 93) {
            throw new BadRequest(this.id + ' fetchBorrowRateHistory limit parameter cannot exceed 92');
        }
        const currency = this.currency(code);
        const request = {
            'asset': currency['id'],
            'limit': limit,
        };
        if (since !== undefined) {
            request['startTime'] = since;
            const endTime = this.sum(since, limit * 86400000) - 1; // required when startTime is further than 93 days in the past
            const now = this.milliseconds();
            request['endTime'] = Math.min(endTime, now); // cannot have an endTime later than current time
        }
        const response = await this.sapiGetMarginInterestRateHistory(this.extend(request, params));
        const result = [];
        for (let i = 0; i < response.length; i++) {
            const item = response[i];
            const timestamp = this.safeNumber(item, 'timestamp');
            result.push({
                'currency': code,
                'rate': this.safeNumber(item, 'dailyInterestRate'),
                'timestamp': timestamp,
                'datetime': this.iso8601(timestamp),
                'info': item,
            });
        }
        return result;
    }

    async createGiftCode(code, amount, params = {}) {
        await this.loadMarkets();
        const currency = this.currency(code);
        const request = {
            'token': currency['id'],
            'amount': amount,
        };
        const response = await this.sapiPostGiftcardCreateCode(this.extend(request, params));
        const data = this.safeValue(response, 'data');
        const giftcardCode = this.safeString(data, 'code');
        const id = this.safeString(data, 'referenceNo');
        return {
            'info': response,
            'id': id,
            'code': giftcardCode,
            'currency': code,
            'amount': amount,
        };
    }

    async redeemGiftCode(giftcardCode, params = {}) {
        const request = {
            'code': giftcardCode,
        };
        const response = await this.sapiPostGiftcardRedeemCode(this.extend(request, params));
        return response;
    }

    async verifyGiftCode(id, params = {}) {
        const request = {
            'referenceNo': id,
        };
        const response = await this.sapiGetGiftcardVerify(this.extend(request, params));
        return response;
    }
};
