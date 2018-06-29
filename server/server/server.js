/* jshint node: true */
'use strict';

/**
 * This is a mock implementation of the public Coinify API, used for dev testing.
 */

/////////////////////////////////////////////
// Setup Express and variables

const fs = require('fs');
const https = require('https');
const http = require('http');
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const SafeCharge = require('./safecharge');

const HTTP_PORT = 8087;
const HTTPS_PORT = 8443;

let tradeCreateDate;
const serverStartDate = new Date();

// Conversion rates between currencies.
const rates = {
  'USD': 0.85,
  'EUR': 1,
  'GBP': 1.14,
  'DKK': 0.13,
};

/**
 * The TradeManager should serve as a emulated trade repository. It's used to simplify this mock service to enable testing the full flow of the safecharge solution locally
 * without spinning up the full set of backend services / environment.
 */
const TradeManager = {
};
TradeManager.container = {};
TradeManager.getSafeChargePaymentUrl = function() {
  const port = "8087";
  const base = "http%3A%2F%2Flocalhost%3A" + port + "%2Fcallback.html%3F";
  const successUrl = base + "success";
  const errorUrl = base + "failure";
  const pending_url = base + "pending";
  const src_url = "https://ppp-test.safecharge.com/ppp/purchase.do?merchant_site_id=140263&merchant_id=7583429810138495724&time_stamp=2018-05-06 10:13:31&total_amount=10&currency=USD&checksum=2212a3bfc23e00b6a2a238dfa25513ebfb2425a3e3d1edc5725b81bd1e93d40f&item_name_1=Cashier Test product&item_amount_1=10&item_quantity_1=1&user_token=auto&version=3.0.0&user_token_id=Test_&item_open_amount_1=true&item_min_amount_1=1&item_max_amount_1=1000&first_name=Arslan&last_name=Pervaiz&email=test@test.com&address1=test&city=test&country=NL&zip=123456&phone1=123456&payment_method=cc_card&userid=test1234&success_url=http://localhost:8087/callback.html?success&back_url=http://localhost:8087/callback.html?return/safecharge&error_url=http://localhost:8087/callback.html?rejected";
  return src_url;
};
TradeManager.getSafeChargeTrade = function() {
  const id = 123123123;
  const self = TradeManager;
  const trade =  self.container[id];
  if ( !trade ) {
    console.error( "ERROR: Sagecharge trade did not exist" );
    return self.createSafeChargeTrade();
  }
  return trade;
}
TradeManager.createSafeChargeTrade = function() {
  const self = TradeManager;

  // const port = "3000";
  const redirectUrl = TradeManager.getSafeChargePaymentUrl();

  const dateRightNow = Date.now();
  const tradeCreateDate = dateRightNow;

  const id = 123123123;
  const trade = {
    "id": id,
    "traderId": 754035,
    "state": "awaiting_transfer_in",
    "inCurrency": "EUR",
    "outCurrency": "BTC",
    "inAmount": 12.00,
    "outAmountExpected": 0.01275487,
    "transferIn": {
      "id": 4433662222,
      "currency": "EUR",
      "sendAmount": 12.00,
      "receiveAmount": 12.00,
      "medium": "card",
      "cardPaymentId": "this-is-the-cardPaymentId-from-the-trade-object",
      "details": {
        "provider": "safecharge",
        "providerMerchantId": "07b172fb-cdf4-44d0-abf4-111a926fff7c",
        "redirectUrl": redirectUrl // "https://ppp-test.safecharge.com/ppp/purchase.do?numberofitems=1&country=US&merchantLocale=en_US&customField1=f3e206fd-df95-4e75-999e-59b125952db5&city=&theme_id=New+Template+2018-01-10+10%3A01%3A46&county=&discount=0&item_name_1=CY122&customData=&merchant_id=7583429810138495724&userid=100&isNative=1&phone1=&error_url=http%3A%2F%2Fsafecharge.coinify.com%3A4200%3Ffailure&shipping=0&payment_method_mode=&checksum=1af29d622f678d4d2279d24e48168ccd4282067a9e65dab967e605f29046a0a2&currency=USD&promoCode=&user_token=auto&state=&first_name=Arslan&email=kmo%2B3%40coinify.com&payment_method=&success_url=http%3A%2F%2Fsafecharge.coinify.com%3A4200%3Fsuccess&zip=&productId=&customSiteName=&merchant_site_id=140263&address1=&item_shipping_1=&pending_url=http%3A%2F%2Fsafecharge.coinify.com%3A4200%3Fpending&back_url=https%3A%2F%2Fapp-api.coinify.com%2Fcard%2Freturn%2Fsafecharge&skip_billing_tab=&last_name=Pervaiz&encoding=UTF-8&total_tax=0.0&notify_url=https%3A%2F%2Fwww.coinify.com&version=4.0.0&user_token_id=100&item_discount_1=&total_amount=80.34&skip_review_tab=&handling=0&item_quantity_1=1&item_amount_1=80.34&"
      }
    },
    "transferOut": {
      "id": 4433662233,
      "currency": "BTC",
      "medium": "blockchain",
      "sendAmount": 0.01275487,
      "receiveAmount": 0.01275487,
      "details": {
        // Trader's bitcoin address that will receive BTC if trade completes
        "account": "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa"
      }
    },
    "quoteExpireTime": new Date(dateRightNow + 15 * 60000).toJSON(), // Now plus 15 minutes
    "updateTime": new Date(dateRightNow).toJSON(),
    "createTime": new Date(dateRightNow).toJSON()
  };

  self.container[ id ] = trade;

  return trade;
}

/**
 * The KYCManager should serve as a emulated kyc repository.
 *
 * We can use it to hold the state of the KYC process and to emulate the KYC process in 
 * when testing the trade-component.
 */
const KYCManager = {
};
KYCManager.container = {};
KYCManager.getReview = function( id, defaultData ) {
  if ( !defaultData ) {
    defaultData = {
      id,
      state: "completed",
      returnUrl: "https://mypage.com/kyc_complete",
      redirectUrl: "https://example.com/url/to/perform/kyc/review",
      externalId: "97162e9d-56fb-40fc-941e-4d958d0a421a",
      updateTime: "2016-07-07T12:11:36Z",
      createTime: "2016-07-07T12:10:19Z"
    };
  }
  const self = KYCManager;
  if ( !self.container[id] ) {
    self.container[id] = {};
    self.upsertReview( id, defaultData );
  }
  return self.container[id];
}
KYCManager.upsertReview = function( id, data ) {
  const self = KYCManager;
  if ( !self.container[id] ){
    console.log( "Cannot find #" + id + " in ", self.container );
    self.container[id] = {};
  }
  for( const key in data ) {
    if ( !key ){
      continue;
    }
    self.container[id][key] = data[key];
  }
  return self.container[id];
}

// Configure Express
const app = express(); // Initialize Express
app.use(cors()); // Allow CORS for express server
app.use(bodyParser.json()); // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({ // to support URL-encoded bodies
  extended: true
}));


const currentUser = {
  userTokenId: "coinify-userid",
  clientRequestId: 'transction1'
};


const PSP = {};

PSP.safecharge = new SafeCharge( {
  account: {
    referenceId: 'userid' + Math.round( Math.random() * 99999 ),
    country: 'GB',
    email: 'test@test.dk'
  },
  tradeId: '344365648',
  returnBaseUrl: 'http://localhost:8087/',
  merchantId: '7583429810138495724',
  merchantSiteId: '140263',
  merchantSecretKey: '6el7QJf3BIgBoPVeSmOPHjYBHl7UN93OGvZkDiIKZXCi4dYgv0gwmkohJAz8AKtH',
  merchantHostURL: 'ppp-test.safecharge.com'
} );

PSP.GetStoreCardPayload = function( cb ) {
  const payloadTemplate = {
    "merchantSiteId": "140263",
    "environment": "test",
    "sessionToken": null,
    "billingAddress": { 
      "city": null,
      "country": "DK",
      "zip": null,
      "email": "kmo+sctest@coinify.com",
      "firstName": null,
      "lastName": null,
      "state": null 
    },
    "cardData": {
      "cardNumber": null,
      "cardHolderName": null,
      "expirationMonth": null,
      "expirationYear": null,
      "CVV": null
    }
  };
  PSP.GetSessionToken( result => {
    payloadTemplate.sessionToken = result.sessionToken;
    cb( payloadTemplate );
  } );
  return payloadTemplate;
};

PSP.SaveCard = function( sessionToken, tempToken, userTokenId, clientRequestId, cb ) {
  //const userTokenId = "";
  //const clientRequestId = "";
  console.log("createUser; CREATING USER OR ENSURING USERIS THERE...." );
  PSP.safecharge.createUser( {
    clientRequestId: clientRequestId,
    userDetail: {
      userTokenId: userTokenId,
      firstName: 'asd',
      lastName :'321',
      address: '123',
      state: 'na',
      city: 'sadas',
      zip: '1234',
      countryCode: 'DK',
      phone: '12121212',
      locale: 'en',
      email: 'test@test.se'
    }
  } ).then( createUserRet => {
    console.log( "createUser; returned=", createUserRet );

    const opts = {
      userTokenId: userTokenId,
      sessionToken: sessionToken,
      ccTempToken: tempToken,
      clientRequestId: clientRequestId,
    };
    console.log( "addUPOCreditCardByTempToken..." );
    PSP.safecharge.addUPOCreditCardByTempToken( opts ).then( ret => {
      console.log( "addUPOCreditCardByTempToken returned=", ret );
      cb(ret);
    } ).catch ( e => {
      console.error( "ERROR ", e );
    } );


  } );


};

PSP.GetSavedCards = function( cb ) {
  PSP.safecharge.getUserUPOs( {
    userTokenId: currentUser.userTokenId,
    clientRequestId: currentUser.clientRequestId
  } ).then( ret => {
    cb( ret );
  } );
};

PSP.GetSessionToken = function( cb ) {
  const options = {
    account: {
      referenceId: 'userid' + Math.round( Math.random() * 99999 ),
      country: 'GB',
      email: 'test@test.dk'
    },
    tradeId: '344365648' + Math.round( Math.random() * 999 ),
    returnBaseUrl: 'http://localhost:8087/',
    merchantId: '7583429810138495724',
    merchantSiteId: '140263',
    merchantSecretKey: '6el7QJf3BIgBoPVeSmOPHjYBHl7UN93OGvZkDiIKZXCi4dYgv0gwmkohJAz8AKtH',
    merchantHostURL: 'ppp-test.safecharge.com'
  };
  const safecharge = new SafeCharge( options );
  safecharge.getSessionToken().then( token => {
    console.error( "token ", token );
    cb(token);
  } ).catch ( e => {
    console.error( "ERROR ", e );
  } );
};

PSP.Payment = function( UPOId, cb ) {
  console.log("Payment...");
  PSP.safecharge.getSessionToken().then( session => {
    console.error( "Got session for Payment ", session );

    const opts = {
      sessionToken: session.sessionToken,
      clientUniqueId: 'uniqueClientId' + Math.random(),
      clientRequestId: session.clientRequestId,
      userTokenId: currentUser.userTokenId,
      isDynamic3D: 1,
      notificationUrl: 'http://callbacks.coinify.com/safecharge-callback',
      deviceDetails: {
        deviceType: 'abc',
        deviceName: 'asdb',
        browser: 'Safari',
        ipAddress: '124.123.123.123',
        deviceOS: 'OSX'
      },
      billingAddress: {
        firstName: 'John',
        lastName: 'Doe',
        country: 'DK',
        email: 'john.doe@gmail.se',
      },
      transaction: {
        amount: '100',
        reference: 'test-' + Math.round(Math.random() * 1000),
        currency: 'EUR'
      },
      userPaymentOption: {
        userPaymentOptionId: UPOId,
        CVV: '123'
      }
    };
    console.log( "dynamic3D..." );
    PSP.safecharge.dynamic3D( opts ).then( dynamic3DResponse => {
      console.log( "dynamic3DResponse ", dynamic3DResponse );
      cb( dynamic3DResponse );
    } );    

  } ).catch ( e => {
    console.error( "ERROR ", e );
  } );

/*    !arrDynamic3DParams.clientUniqueId || !arrDynamic3DParams.notificationUrl || !arrDynamic3DParams.deviceDetails.deviceType ||
    !arrDynamic3DParams.transaction.amount || !arrDynamic3DParams.deviceDetails.deviceName || !arrDynamic3DParams.transaction.currency || !arrDynamic3DParams.deviceDetails.deviceOS ||
    !arrDynamic3DParams.transaction.reference || !arrDynamic3DParams.deviceDetails.browser || !arrDynamic3DParams.deviceDetails.ipAddress ||
    !arrDynamic3DParams.billingAddress.firstName || !arrDynamic3DParams.billingAddress.lastName || !arrDynamic3DParams.billingAddress.country || !arrDynamic3DParams.billingAddress.email
*/
  return;
  const opts = {
    clientUniqueId: currentUser.clientUniqueId,

  };
  PSP.safecharge.dynamic3D();


  const payment = {
    id: '4325544',
    amount: 100,
    currency: 'EUR'
  };
  
  const options = {
    account: {
      referenceId: 'userid' + Math.round( Math.random() * 99999 ),
      country: 'GB',
      email: 'asdsa@asdasd.se'
    },
    tradeId: '344365648',
    returnBaseUrl: 'http://localhost:8087/',
    merchantId: '7583429810138495724',
    merchantSiteId: '140263',
    merchantSecretKey: '3212',
    merchantHostURL: 'ppp-test.safecharge.com'
  };

  const providerDetails = {
    callBackURL: 'http://localhost:8087/callback.html' // https://app-api.sandbox.coinify.com/card/callbacks/safecharge http://localhost:8087/'
  };

  const createSafeChargePaymentArgs = {
    internalPaymentId: payment.id,
    userId: options.account.referenceId,
    amount: parseInt(payment.amount),
    currency: payment.currency,
    reference: 'CY' + options.tradeId,
    billingAddress: {
      firstName: 'Niels-Niels',
      lastName: 'Nielsen',
      country: options.account.country, // This is mandatory parameter for Safecharge
      email: options.account.email
    },
    urlDetails: {
      successUrl: options.returnBaseUrl + 'safecharge/callback.html?success',
      failureUrl: options.returnBaseUrl + 'safecharge/callback.html?rejected',
      pendingUrl: '',
      notificationUrl: providerDetails.callBackURL,
      backUrl: options.retureturnBaseUrlrnUrl + 'safecharge/callback.html?cancelled'
    },
    themeId: '185203'
  };

  const safecharge = new SafeCharge( options );
  safecharge.getPaymentURL(createSafeChargePaymentArgs).then( url => {
    console.log( "url ", url );
    cb(url);
  } ).catch ( e => {
    console.error( "", e );
  } );
};





// Route all Traffic to Secure Server
// Order is important (this should be the first route)
// app.all('*', function(req, res, next){
//   if (req.secure) {
//     return next();
//   }
//   res.redirect('https://localhost:'+HTTPS_PORT+req.url);
// });

/////////////////////////////////////////////
// Endpoint route mocks

app.get('/', function(req, res) {
  res.send('Hello World!');
});

app.get('/me/trader/storeCardPayload', function(req, res) {
  PSP.GetStoreCardPayload( payload => {
    res.send( {
      payload: payload,
      psp: 'safecharge'
    } );
  } );
});

app.post( '/me/trader/cards', function( req, res ) {
  if ( !req.body.sessionToken ) {
    res.json( {error: 'nosession' } );
    return;
  }
  PSP.SaveCard( req.body.sessionToken, req.body.ccTempToken, currentUser.userTokenId, currentUser.clientRequestId, (saveCardRet) => {
    res.json( saveCardRet );
  });
} );

app.get( '/me/trader/cards', function( req, res) {
  PSP.GetSavedCards( _cards => {
    res.send( {
      cards: _cards
    } );
  } );
} );

app.post( '/me/trader/cards/pay', function( req, res) {
  PSP.Payment( req.body.upo, resp => {
    res.send( resp );
  } );
} );

app.post('/auth', (req, res) => {
  console.log('/auth request:', req.body);
  if (req.body.email && req.body.password && req.body.email.startsWith('test') && req.body.password === 'test') {
    res.send({
      access_token: "eyJ0eXAiOiJKV1QiLCJhbGciOiJFUzI1NiJ9.eyJpYXQiOjE0NzQ0NTY0MDUsImV4cCI6MTQ3NDQ1NzYwNSwidWlkIjo1LCJzYyI6eyJ0XzUiOiIqIn19.xufRVLP7bKPaGJZ9Xqo1YePMMRXXhO2gE1zjy3GQD5pwvt49d64v10YjqEmAUYLBW7TdF3rb1eQo6rE1rt8Fww",
      expires_in: 1200,
      refresh_token: "mapPltjPb09ZjpYHBS9CQ0U/OG45AACKdKx/B3bXNN6qFHlFq4E8UEH7+KuMYFGw",
      token_type: "bearer"
    });
  } else if (req.body.refresh_token) {
    res.send({
      access_token: "eyJ0eXAiOiJKV1QiLCJhbGciOiJFUzI1NiJ9.eyJpYXQiOjE0NzQ0NTY4NzUsImV4cCI6MTQ3NDQ1ODA3NSwidWlkIjo1LCJzYyI6eyJ0XzUiOiIqIn19.Dingzo4Ell_DL7B3QV4YHXJlZ_C-1GfqNfChVuKCPE17c6we_IqySTxjK7yBlMk5rwLqPoaUGKdbJsR6QmkPig",
      expires_in: 1200,
      refresh_token: "mapPltjPb09ZjpYHBS9CQ0U/OG45AACKdKx/B3bXNN6qFHlFq4E8UEH7+KuMYFGw",
      token_type: "bearer"
    });
  } else if (req.body.grant_type && req.body.grant_type === 'offline_token' && req.body.offline_token) {
    res.send({
      access_token: "eyJ0eXAiOiJKV1QiLCJhbGciOiJFUzI1NiJ9.eyJpYXQiOjE0NzQ0NTY4NzUsImV4cCI6MTQ3NDQ1ODA3NSwidWlkIjo1LCJzYyI6eyJ0XzUiOiIqIn19.Dingzo4Ell_DL7B3QV4YHXJlZ_C-1GfqNfChVuKCPE17c6we_IqySTxjK7yBlMk5rwLqPoaUGKdbJsR6QmkPig",
      expires_in: 1200,
      token_type: "bearer"
    });
  } else {
    res.sendStatus(401);
  }
});

app.get('/traders/me', (req, res) => {
  console.log('/traders/me query:', req.query);

  const bearerToken = req && req.headers && req.headers.authorization ? req.headers.authorization : undefined;
  if ( !bearerToken ) {
    console.error( "missing bearer token" );
    res.sendStatus(404);
    return;
  }

  const response = {
    "id": 1234,
    "defaultCurrency": "EUR",
    "email": "stj+boellebob@coinify.com",
    "canTradeAfter": new Date(serverStartDate.getTime() + 604800 * 1000).toISOString(),
    "profile": {
      "name": "Bølle Bob",
      "gender": "male",
      "address": {
        "street": "Amagerbrogade 123",
        "zipcode": "2300",
        "city": "København S",
        "country": "DK"
      },
      "mobile": {
        "countryCode": "45",
        "number": "10203040"
      }
    },
    "level": {
      "id": 2,
      "name": "2",
      "currency": "EUR",
      "feePercentage": 2,
      "limits": {
        "bank": {
          "in": {
            "daily": 1000
          },
          "out": {
            "daily": 10000
          }
        },
        "card": {
          "in": {
            "daily": 300,
            "yearly": 1000
          }
        }
      },
      "requirements": [{
        "type": "kyc",
        "fulfilled": false
      }, {
        "type": "bankTransferVolume",
        "amount": 1000,
        "fulfilledDelay": 604800,
        "fulfilled": true
      }]
    },
    "nextLevel": {
      "id": 3,
      "name": "3",
      "currency": "EUR",
      "feePercentage": 2,
      "limits": {
        "bank": {
          "in": {
            "daily": 10000
          },
          "out": {
            "daily": 10000
          }
        },
        "card": {
          "in": {
            "daily": 300,
            "yearly": 1000
          }
        }
      },
      "requirements": [{
        "type": "bankTransferVolume",
        "amount": 1000,
        "fulfilledDelay": 604800,
        "fulfilled": false
      }, {
        "type": "kyc",
        "fulfilled": false
      }]
    },
    "currentLimits": {
      "bank": {
        "in": 1000,
        "out": 10000
      },
      "card": {
        "in": 300
      }
    },
    "canTrade": true
  };

  if ( bearerToken.indexOf( "test kyc in cardpay" ) >= 0 ) {
    response.level.id = 1;
    response.level.limits.card.in.yearly = 1000;
    if ( bearerToken.indexOf( "3") >= 0 ) {
      response.currentLimits.card.in = 100;
    }
  } else if ( bearerToken.indexOf( "test buy" ) >= 0 ) {
    console.log( "Fulfilling KYC requirement to circumvent KYC flow when testing credit card payment.");
    // Make the requirement fulfilled to its possible to test payment without KYC for bank.
    response.nextLevel.requirements.find(x=>x.type=='kyc').fulfilled = true;
  }


  res.send(response);
});

app.post('/traders/me/kyc', (req, res) => {
  const bearerToken = req && req.headers && req.headers.authorization ? req.headers.authorization : undefined;
  if ( !bearerToken ) {
    console.error( "missing bearer token" );
    res.sendStatus(404);
    return;
  }

  const _externalId = "d0cc11d4-d4d0-4494-9de7-919e2c055051";
  const newId = 55555;
  const response = KYCManager.getReview( newId, {
    id: newId,
    state: "pending",
    returnUrl: "https://mypage.com/kyc_complete",
    redirectUrl: "https://example.com/url/to/perform/kyc/review",
    externalId: _externalId,
    updateTime: "2016-07-07T12:11:36Z",
    createTime: "2016-07-07T12:10:19Z",
    _testCount: 1
  } );
  res.send( response );
} );

app.get('/kyc/:id', (req, res) => {
  console.log('/kyc', req.params);

  const bearerToken = req && req.headers && req.headers.authorization ? req.headers.authorization : undefined;
  if ( !bearerToken ) {
    console.error( "missing bearer token" );
    res.sendStatus(404);
    return;
  }

  let response = KYCManager.upsertReview( req.params.id, { } );
  // keep the state as pending of the review and wait until the web-app has asked some times.
  if ( response._testCount < 5 ) {
    response = KYCManager.upsertReview( req.params.id, { _testCount: response._testCount + 1 } );
  } else {
    response = KYCManager.upsertReview( req.params.id, { state: "reviewing" } );
  }
  setTimeout( () => {
    res.send( response );
  }, 2500);
});

app.get('/trades/payment-methods', (req, res) => {
  console.log( '/trades/payment-methods query:', req.query );
  
  const bearerToken = req && req.headers && req.headers.authorization ? req.headers.authorization : undefined;
  if ( !bearerToken ) {
    console.error( "missing bearer token" );
    res.sendStatus(404);
    return;
  }

  const response = [
    {
      "inMedium": "bank",
      "outMedium": "blockchain",
      "name": "Buy bitcoins with bank transfer",
      "inCurrencies": [
        "DKK",
        "EUR",
        "USD",
        "GBP"
      ],
      "outCurrencies": [
        "BTC"
      ],
      "limitInAmounts": {
        "DKK": 10000,
        "EUR": 10000,
        "USD": 10000,
        "GBP": 10000
      },
      "minimumInAmounts": {
        "DKK": 372.09,
        "EUR": 50,
        "USD": 58.73,
        "GBP": 44.05
      },
      "inFixedFees": {
        "DKK": 0,
        "EUR": 0,
        "USD": 0,
        "GBP": 0
      },
      "inPercentageFee": 0.25,
      "outFixedFees": {
          "BTC": 0.0001
      },
      "outPercentageFee": 0,
      "canTrade": true, 
      "cannotTradeReasons": []
    },
    {
      "inMedium": "blockchain",
      "outMedium": "bank",
      "name": "Sell bitcoins to bank transfer",
      "inCurrencies": [
        "BTC"
      ],
      "outCurrencies": [
        "DKK",
        "EUR",
        "USD",
        "GBP"
      ],
      "limitInAmounts": {
        "BTC": 0.01398541
      },
      "minimumInAmounts": {
        "BTC": 0.01329299
      },
      "inFixedFees": {
          "BTC": 0
      },
      "inPercentageFee": 0,
      "outFixedFees": {
        "DKK": 0,
        "EUR": 0,
        "USD": 0,
        "GBP": 0
      },
      "outPercentageFee": 0.25,
      "canTrade": true, 
      "cannotTradeReasons": []
    },
    {
      "inMedium": "card",
      "outMedium": "blockchain",
      "name": "Buy bitcoins with card transfer",
      "inCurrencies": [
        "DKK",
        "EUR",
        "USD",
        "GBP"
      ],
      "outCurrencies": [
          "BTC"
      ],
      "limitInAmounts": {
        "DKK": 2234.97,
        "EUR": 300,
        "USD": 358.52,
        "GBP": 263.97
      },
      "minimumInAmounts": {
        "DKK": 74.42,
        "EUR": 10,
        "USD": 11.75,
        "GBP": 8.81
      },
      "inFixedFees": {
        "DKK": 0,
        "EUR": 0,
        "USD": 0,
        "GBP": 0
      },
      "inPercentageFee": 3,
      "outFixedFees": {
          "BTC": 0.0001
      },
      "outPercentageFee": 0,
      "canTrade": true, 
      "cannotTradeReasons": []
    }
  ];

  // When testing that we are able to show the KYC flow on card purchases we set the canTrade to false here.
  if ( bearerToken.indexOf( "test kyc in cardpay" ) >= 0 ) {
    if ( bearerToken == "Bearer test kyc in cardpay 2" ) {
      response[0].canTrade = true; // bank
      response[1].canTrade = true; // blockchain
      // card
      response[2].canTrade = true;
      const amt = 100;
      response[2].limitInAmounts = {
        "DKK": amt / rates['DKK'],
        "EUR": amt,
        "USD": amt / rates['USD'],
        "GBP": amt / rates['GBP']
      };
    } else if ( bearerToken == "Bearer test kyc in cardpay 3" ) {
      response[0].canTrade = true; // bank
      response[1].canTrade = true; // blockchain
      // card
      response[2].canTrade = true;
      const amt = 100;
      response[2].limitInAmounts = {
        "DKK": amt / rates['DKK'],
        "EUR": amt,
        "USD": amt / rates['USD'],
        "GBP": amt / rates['GBP']
      };
    } else {
      response[0].canTrade = false; // bank
      response[1].canTrade = false; // blockchain
      // card
      response[2].canTrade = false;
      response[2].limitInAmounts = {
        "DKK": 0,
        "EUR": 0,
        "USD": 0,
        "GBP": 0
      };
    }
  }

  res.send( response );
});

app.get('/rates/approximate', (req, res) => {
  console.log('/rates/approximate request:', req.query);

  // If base and quote currency is the same, then rate is always 1
  if (req.query.baseCurrency === req.query.quoteCurrency) {
    res.send({
      "baseCurrency": req.query.baseCurrency,
      "quoteCurrency": req.query.quoteCurrency,
      "rate": 1
    });
    return;
  }

  switch (req.query.baseCurrency) {
    case 'EUR':
      switch (req.query.quoteCurrency) {
        case 'BTC':
          res.send({
            "baseCurrency": "EUR",
            "quoteCurrency": "BTC",
            "rate": 0.0008586591746448359
          });
          break;
        case 'USD':
          res.send({
            "baseCurrency": "EUR",
            "quoteCurrency": "USD",
            "rate": 1.0885431917610342
          });
          break;
        case 'GBP':
          res.send({
            "baseCurrency": "EUR",
            "quoteCurrency": "GBP",
            "rate": 0.850485
          });
          break;
        case 'DKK':
          res.send({
            "baseCurrency": "EUR",
            "quoteCurrency": "DKK",
            "rate": 7.439612999999999
          });
          break;
      }
      break;
    case 'USD':
      res.send({
        "baseCurrency": "USD",
        "quoteCurrency": "BTC",
        "rate": 0.00136989
      });
      break;
    case 'GBP':
      res.send({
        "baseCurrency": "GBP",
        "quoteCurrency": "BTC",
        "rate": 0.00170802
      });
      break;
    case 'DKK':
      res.send({
        "baseCurrency": "DKK",
        "quoteCurrency": "BTC",
        "rate": 0.000194725
      });
      break;
    case 'BTC':
      switch (req.query.quoteCurrency) {
        case 'EUR':
          res.send({
            "baseCurrency": "BTC",
            "quoteCurrency": "EUR",
            "rate": 700.213
          });
          break;
        case 'USD':
          res.send({
            "baseCurrency": "BTC",
            "quoteCurrency": "USD",
            "rate": 740.833
          });
          break;
        case 'GBP':
          res.send({
            "baseCurrency": "BTC",
            "quoteCurrency": "GBP",
            "rate": 593.699
          });
          break;
        case 'DKK':
          res.send({
            "baseCurrency": "BTC",
            "quoteCurrency": "DKK",
            "rate": 5205.76
          });
          break;
        default:
          res.send({
            "baseCurrency": "BTC",
            "quoteCurrency": "EUR",
            "rate": 700.213
          });
          break;
      }
      break;
    default:
      res.send({
        "baseCurrency": "EUR",
        "quoteCurrency": "BTC",
        "rate": 0.00144856
      });
      break;
  }
});

app.post('/trades/quote', (req, res) => {
  console.log('/trades/quote request:', req.body);

  const rate = new Map([
    ['BTC', 1],
    ['EUR', 722.643],
    ['USD', 771.406],
    ['GBP', 610.418],
    ['DKK', 5386.96]
  ]);

  const convert = (inAmount, inCurrency, outCurrency) => {
    const outAmount = inAmount / rate.get(inCurrency) * rate.get(outCurrency);
    if (outCurrency === 'BTC') {
      return Number(outAmount).toFixed(8); // amount with up to 8 decimals
    }
    return Number(outAmount).toFixed(2); // amount with up to 2 decimals
  };

  res.send({
    "id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
    "baseCurrency": req.body.baseCurrency,
    "quoteCurrency": req.body.quoteCurrency,
    "baseAmount": req.body.baseAmount,
    "quoteAmount": convert(req.body.baseAmount, req.body.baseCurrency, req.body.quoteCurrency) * -1,
    "issueTime": Date.now(),
    "expiryTime": new Date(Date.now() + 15 * 60000) // Now plus 15 minutes
  });
});

app.get('/trades/:tradeId(\\d+)', (req, res) => {
  console.log(`/trades/${req.params.tradeId} query`, req.query);

  if (!tradeCreateDate) {
    console.log('tradeCreateDate not set!');
    res.sendStatus(404);
    return;
  }

  const bearerToken = req && req.headers && req.headers.authorization ? req.headers.authorization : undefined;
  if ( !bearerToken ) {
    console.error( "missing bearer token" );
    res.sendStatus(404);
    return;
  }

  // Special SafeCharge trade 
  if (req.params.tradeId === '123123123' || bearerToken == "Bearer test safecharge" ) {
    const trade = TradeManager.getSafeChargeTrade();
    res.send( trade );
    return;
  }

  const response = {
    "id": req.params.tradeId,
    "traderId": 754035,
    "state": "processing",
    "inCurrency": "EUR",
    "outCurrency": "BTC",
    "inAmount": -1000.00,
    "outAmountExpected": 2.41526674,
    "transferIn": {
      "id": 4433662222,
      "currency": "EUR",
      "sendAmount": 1000.00,
      "receiveAmount": 1000.00,
      "medium": "card",
      "details": {
        "paymentId": "1234-abcd-19",
        "redirectUrl": "some_url"
      }
    },
    "transferOut": {
      "id": 4433662233,
      "currency": "BTC",
      "medium": "blockchain",
      "sendAmount": 2.41526674,
      "receiveAmount": 2.41526674,
      "details": {
        // Trader's bitcoin address that will receive BTC if trade completes
        "account": "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa"
      }
    },
    "quoteExpireTime": new Date(tradeCreateDate + 15 * 60000), // create date plus 15 minutes
    "updateTime": tradeCreateDate,
    "createTime": tradeCreateDate
  };


  res.send( response );
});

app.post('/trades', (req, res) => {
  console.log('/trades POST request:', req.body);

  // Test for rejecting bitcoin address. All other than 'aa' will be accepted
  if (req.body.transferOut.details.account === 'aa') {
    return res.status(403).send({
      error: 'invalid_blockchain_account',
      error_description: 'Blockchain account not valid'
    });
  }

  const bearerToken = req && req.headers && req.headers.authorization ? req.headers.authorization : undefined;
  if ( !bearerToken ) {
    console.log( "missing bearer token" );
    res.sendStatus(404);
    return;
  }

  const dateRightNow = Date.now();
  tradeCreateDate = dateRightNow;

  // Special trade with SafeCharge as provider (set bitcoin payout address as "safecharge")
  if (req.body.transferOut.details.account === 'safecharge' || bearerToken == "Bearer test safecharge") {
    const scTrade = TradeManager.createSafeChargeTrade();
    res.send( scTrade );
    return;
  }

  // Default trade created
  const data = {
    "id": 113475347,
    "traderId": 754035,
    "state": "awaiting_transfer_in",
    "inCurrency": "EUR",
    "outCurrency": "BTC",
    "inAmount": -1000.00,
    "outAmountExpected": 2.41526674,
    "transferIn": {
      "id": 4433662222,
      "currency": "EUR",
      "sendAmount": 1000.00,
      "receiveAmount": 1000.00,
      "medium": "card",
      "details": {
        "paymentId": "c853344d-9092-4ccf-8c18-5dfd3fca9417",
        "redirectUrl": "some_url2"
      }
    },
    "transferOut": {
      "id": 4433662233,
      "currency": "BTC",
      "medium": "blockchain",
      "sendAmount": 2.41526674,
      "receiveAmount": 2.41526674,
      "details": {
        // Trader's bitcoin address that will receive BTC if trade completes
        "account": "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa"
      }
    },
    "quoteExpireTime": new Date(dateRightNow + 15 * 60000).toJSON(), // Now plus 15 minutes
    "updateTime": new Date(dateRightNow).toJSON(),
    "createTime": new Date(dateRightNow).toJSON()
  };
  res.send( data );
});

app.get('/trades', (req, res) => {
  console.log('/trades GET request');

  const bearerToken = req && req.headers && req.headers.authorization ? req.headers.authorization : undefined;
  if ( !bearerToken ) {
    console.error( "missing bearer token" );
    res.sendStatus(404);
    return;
  }

  if (!tradeCreateDate) {
    tradeCreateDate = Date.now();
  }

  tradeCreateDate = tradeCreateDate + 1234;

  let response = [
    // BTC to Bank EUR
    // State: awaiting_transfer_in
    {
      "id": 113275347,
      "traderId": 754035,
      "state": "awaiting_transfer_in",
      "inCurrency": "BTC",
      "outCurrency": "EUR",
      "inAmount": 0.12345678,
      "outAmountExpected": 111.69,
      "transferIn": {
        "id": 4433628273,
        "currency": "BTC",
        "medium": "blockchain",
        "sendAmount": 0.12345678,
        "receiveAmount": 0.12345671,
        "details": {
          // Trader's bitcoin address that will receive BTC if trade completes
          "account": "1A1uC9eP5QGefi2DMPTfTL5SLmv7DivfNa"
        }
      },
      "transferOut": {
        "id": 4432361236,
        "currency": "EUR",
        "sendAmount": 111.69,
        "receiveAmount": 111.69,
        "medium": "bank",
        "mediumReceiveAccountId": 9876 // Reference to the traders bank account
      },
      "quoteExpireTime": new Date(tradeCreateDate + 5 * 60000).toJSON(), // Now plus 5 minutes
      "updateTime": new Date(tradeCreateDate + 5 * 60000).toJSON(), // Now plus 5 minutes
      "createTime": new Date(tradeCreateDate + 5 * 60000).toJSON() // Now plus 5 minutes
    },
    // Bank USD to BTC
    // State: awaiting_transfer_in
    {
      "id": 143275347,
      "traderId": 754035,
      "state": "awaiting_transfer_in",
      "inCurrency": "USD",
      "outCurrency": "BTC",
      "inAmount": 150.00,
      "outAmountExpected": 0.15378459,
      "transferIn": {
        "id": 4432362292,
        "currency": "EUR",
        "sendAmount": 150.00,
        "receiveAmount": 150.00,
        "medium": "bank",
        "mediumReceiveAccountId": 123456 // Reference to the traders bank account
      },
      "transferOut": {
        "id": 4433623233,
        "currency": "BTC",
        "medium": "blockchain",
        "sendAmount": 0.15378459,
        "receiveAmount": 0.15378459,
        "details": {
          // Trader's bitcoin address that will receive BTC if trade completes
          "account": "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa"
        }
      },
      "quoteExpireTime": new Date(tradeCreateDate + 5 * 60000).toJSON(), // Now plus 5 minutes
      "updateTime": new Date(tradeCreateDate + 5 * 60000).toJSON(), // Now plus 5 minutes
      "createTime": new Date(tradeCreateDate + 5 * 60000).toJSON() // Now plus 5 minutes
    },
    // Card EUR to BTC - isignthis
    // State: awaiting_transfer_in
    {
      "id": 113475347,
      "traderId": 754035,
      "state": "awaiting_transfer_in",
      "inCurrency": "EUR",
      "outCurrency": "BTC",
      "inAmount": 1000.00,
      "outAmountExpected": 2.41526674,
      "transferIn": {
        "id": 4433662292,
        "currency": "EUR",
        "sendAmount": 1000.00,
        "receiveAmount": 1000.00,
        "medium": "card",
        "details": {
          "provider": "isignthis",
          "paymentId": "c853344d-9092-4ccf-8c18-5dfd3fca9417",
          "redirectUrl": "some_url"
        }
      },
      "transferOut": {
        "id": 4433669233,
        "currency": "BTC",
        "medium": "blockchain",
        "sendAmount": 2.41526674,
        "receiveAmount": 2.41526674,
        "details": {
          // Trader's bitcoin address that will receive BTC if trade completes
          "account": "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa"
        }
      },
      "quoteExpireTime": new Date(tradeCreateDate + 5 * 60000).toJSON(), // Now plus 5 minutes
      "updateTime": new Date(tradeCreateDate + 5 * 60000).toJSON(), // Now plus 5 minutes
      "createTime": new Date(tradeCreateDate + 5 * 60000).toJSON() // Now plus 5 minutes
    },
    // Card EUR to BTC - safecharge
    // State: awaiting_transfer_in
    {
      "id": 113475347,
      "traderId": 754035,
      "state": "awaiting_transfer_in",
      "inCurrency": "EUR",
      "outCurrency": "BTC",
      "inAmount": 1000.00,
      "outAmountExpected": 2.41526674,
      "transferIn": {
        "id": 4433662292,
        "currency": "EUR",
        "sendAmount": 1000.00,
        "receiveAmount": 1000.00,
        "medium": "card",
        "details": {
          "provider": "safecharge",
          "providerMerchantId": "123124324",
          "paymentId": null,
          "cardPaymentId": 1234,
          "redirectUrl": TradeManager.getSafeChargePaymentUrl()
        }
      },
      "transferOut": {
        "id": 4433669233,
        "currency": "BTC",
        "medium": "blockchain",
        "sendAmount": 2.41526674,
        "receiveAmount": 2.41526674,
        "details": {
          // Trader's bitcoin address that will receive BTC if trade completes
          "account": "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa"
        }
      },
      "quoteExpireTime": new Date(tradeCreateDate + 5 * 60000).toJSON(), // Now plus 5 minutes
      "updateTime": new Date(tradeCreateDate + 5 * 60000).toJSON(), // Now plus 5 minutes
      "createTime": new Date(tradeCreateDate + 5 * 60000).toJSON() // Now plus 5 minutes
    },
    // Card USD to BTC
    // State: processing
    {
      "id": 113475348,
      "traderId": 754035,
      "state": "processing",
      "inCurrency": "USD",
      "outCurrency": "BTC",
      "inAmount": 1000.00,
      "outAmount": 2.41551728,
      "transferIn": {
        "id": 5539662233,
        "currency": "USD",
        "sendAmount": 1000.00,
        "receiveAmount": 1000.00,
        "medium": "card",
        "details": {
          // This URL can be used for redirect mode
          "redirectUrl": "https://provider.com/payment/d3aab081-7c5b-4ddb-b28b-c82cc8642a18",
          // This ID can be used for embbeded mode
          "paymentId": "d3aab081-7c5b-4ddb-b28b-c82cc8642a18"
        }
      },
      "transferOut": {
        "id": 5533262233,
        "currency": "BTC",
        "medium": "blockchain",
        "sendAmount": 2.41526674,
        "receiveAmount": 2.41526674,
        "details": {
          // Trader's bitcoin address that has received the 2.41551728 BTC
          "account": "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa",
          // The BTC transaction that sent out the BTC to the above address
          "transaction": "000000000019d6689c085ae165831e934ff763ae46a2a6c172b3f1b60a8ce26f"
        }
      },
      "receiptUrl": "https://trade.coinify.com/receipt/f47ac10b-58cc-4372-a567-0e02b2c3d479",
      "updateTime": "2016-04-21T12:27:36.721Z",
      "createTime": "2016-04-21T12:23:19.081Z"
    },
    // Card DKK to BTC
    // State: reviewing
    {
      "id": 113475581,
      "traderId": 754035,
      "state": "reviewing",
      "inCurrency": "DKK",
      "outCurrency": "BTC",
      "inAmount": 100.00,
      "outAmountExpected": 0.0204327,
      "transferIn": {
        "id": 4433662292,
        "currency": "DKK",
        "sendAmount": 100.00,
        "receiveAmount": 100.00,
        "medium": "card",
        "details": {
          "paymentId": "1234-abcd-19",
          "redirectUrl": "some_url"
        }
      },
      "transferOut": {
        "id": 4433662233,
        "currency": "BTC",
        "medium": "blockchain",
        "sendAmount": 0.0204327,
        "receiveAmount": 0.0204327,
        "details": {
          // Trader's bitcoin address that will receive BTC if trade completes
          "account": "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa"
        }
      },
      "quoteExpireTime": new Date(tradeCreateDate + 10 * 60000).toJSON(), // Now plus 10 minutes
      "updateTime": new Date(tradeCreateDate + 10 * 60000).toJSON(), // Now plus 10 minutes
      "createTime": new Date(tradeCreateDate + 10 * 60000).toJSON() // Now plus 10 minutes
    },
    // Card DKK to BTC
    // State: completed
    {
      "id": 153475726,
      "traderId": 754035,
      "state": "completed",
      "inCurrency": "DKK",
      "outCurrency": "BTC",
      "inAmount": 150.00,
      "outAmountExpected": 0.03147,
      "transferIn": {
        "id": 4433162822,
        "currency": "DKK",
        "sendAmount": 150.00,
        "receiveAmount": 150.00,
        "medium": "card",
        "details": {
          "paymentId": "1234-abcd-19",
          "redirectUrl": "some_url"
        }
      },
      "transferOut": {
        "id": 4431662833,
        "currency": "BTC",
        "medium": "blockchain",
        "sendAmount": 0.03147,
        "receiveAmount": 0.03147,
        "details": {
          // Trader's bitcoin address that will receive BTC if trade completes
          "account": "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa"
        }
      },
      "quoteExpireTime": new Date(tradeCreateDate + 15 * 60000).toJSON(), // Now plus 15 minutes
      "updateTime": new Date(tradeCreateDate + 15 * 60000).toJSON(), // Now plus 15 minutes
      "createTime": new Date(tradeCreateDate + 15 * 60000).toJSON() // Now plus 15 minutes
    },
    // Bank EUR to BTC
    // State: completed
    {
      "id": 153475987,
      "traderId": 754035,
      "state": "completed",
      "inCurrency": "EUR",
      "outCurrency": "BTC",
      "inAmount": 82.41,
      "outAmountExpected": 0.11214791,
      "transferIn": {
        "id": 4433162789,
        "currency": "EUR",
        "sendAmount": 82.41,
        "receiveAmount": 81.07,
        "medium": "bank",
        "details": {
          "paymentId": "1234-abcd-19987",
          "redirectUrl": "some_url_which_is_very_pretty"
        }
      },
      "transferOut": {
        "id": 4431662987,
        "currency": "BTC",
        "medium": "blockchain",
        "sendAmount": 0.11214791,
        "receiveAmount": 0.11210578,
        "details": {
          // Trader's bitcoin address that will receive BTC if trade completes
          "account": "1A1zP1eP5Uns7FDMPTfTL5SLmv7DivfNa"
        }
      },
      "quoteExpireTime": new Date(tradeCreateDate + 15 * 60000).toJSON(), // Now plus 15 minutes
      "updateTime": new Date(tradeCreateDate + 15 * 60000).toJSON(), // Now plus 15 minutes
      "createTime": new Date(tradeCreateDate + 15 * 60000).toJSON() // Now plus 15 minutes
    },
    // Card DKK to BTC
    // State: cancelled
    {
      "id": 113475726,
      "traderId": 754035,
      "state": "cancelled",
      "inCurrency": "DKK",
      "outCurrency": "BTC",
      "inAmount": 50.00,
      "outAmountExpected": 0.0104327,
      "transferIn": {
        "id": 4433662822,
        "currency": "DKK",
        "sendAmount": 50.00,
        "receiveAmount": 50.00,
        "medium": "card",
        "details": {
          "paymentId": "1234-abcd-19",
          "redirectUrl": "some_url"
        }
      },
      "transferOut": {
        "id": 4433662833,
        "currency": "BTC",
        "medium": "blockchain",
        "sendAmount": 0.0104327,
        "receiveAmount": 0.0104327,
        "details": {
          // Trader's bitcoin address that will receive BTC if trade completes
          "account": "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa"
        }
      },
      "quoteExpireTime": new Date(tradeCreateDate + 15 * 60000).toJSON(), // Now plus 15 minutes
      "updateTime": new Date(tradeCreateDate + 15 * 60000).toJSON(), // Now plus 15 minutes
      "createTime": new Date(tradeCreateDate + 15 * 60000).toJSON() // Now plus 15 minutes
    },
    // BTC to Bank EUR
    // State: rejected
    {
      "id": 113425348,
      "traderId": 754035,
      "state": "rejected",
      "inCurrency": "BTC",
      "outCurrency": "EUR",
      "inAmount": 27.12,
      "outAmount": 0.03827261,
      "transferIn": {
        "id": 5533612233,
        "currency": "BTC",
        "sendAmount": 0.03827261,
        "receiveAmount": 0.03827261,
        "medium": "blockchain",
        "details": {
          // Coinify's bitcoin address to where the trader sent the 2.41551728 BTC
          "account": "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa",
          // The BTC transaction that sent out the BTC to the above address
          "transaction": "000000000019d6689c085ae165831e934ff763ae46a2a6c172b3f1b60a8ce26f"
        }
      },
      "transferOut": {
        "id": 5533662244,
        "currency": "EUR",
        "sendAmount": 27.12,
        "receiveAmount": 27.12,
        "medium": "bank",
        "mediumReceiveAccountId": 12345 // Reference to the traders bank account
      },
      "receiptUrl": "https://trade.coinify.com/receipt/f47ac10b-58cc-4372-a567-0e02b2c3d479",
      "updateTime": "2016-04-21T12:27:36.721Z",
      "createTime": "2016-04-21T12:23:19.081Z"
    },
    // BTC to Bank EUR
    // State: expired
    {
      "id": 113415348,
      "traderId": 754035,
      "state": "expired",
      "inCurrency": "BTC",
      "outCurrency": "EUR",
      "inAmount": 27.12,
      "outAmount": 0.03827261,
      "transferIn": {
        "id": 5533612233,
        "currency": "BTC",
        "sendAmount": 0.03827261,
        "receiveAmount": 0.03827261,
        "medium": "blockchain",
        "details": {
          // Coinify's bitcoin address to where the trader sent the 2.41551728 BTC
          "account": "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa",
          // The BTC transaction that sent out the BTC to the above address
          "transaction": "000000000019d6689c085ae165831e934ff763ae46a2a6c172b3f1b60a8ce26f"
        }
      },
      "transferOut": {
        "id": 5533662244,
        "currency": "EUR",
        "sendAmount": 27.12,
        "receiveAmount": 27.12,
        "medium": "bank",
        "mediumReceiveAccountId": 123456 // Reference to the traders bank account
      },
      "receiptUrl": "https://trade.coinify.com/receipt/f47ac10b-58cc-4372-a567-0e02b2c3d479",
      "updateTime": "2016-04-21T12:27:36.721Z",
      "createTime": "2016-04-21T12:23:19.081Z"
    },
    // BTC to Bank EUR
    {
      "id": 113415348,
      "traderId": 754035,
      "state": "completed",
      "inCurrency": "BTC",
      "outCurrency": "EUR",
      "inAmount": 0.02395468,
      "outAmount": 15.91,
      "transferIn": {
        "id": 5533615233,
        "currency": "BTC",
        "sendAmount": 0.02395468,
        "receiveAmount": 0.02395468,
        "medium": "blockchain",
        "details": {
          // Coinify's bitcoin address to where the trader sent the 0.02395468 BTC
          "account": "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa",
          // The BTC transaction that sent out the BTC to the above address
          "transaction": "000000000019d6689c085ae165831e934ff763ae46a2a6c172b3f1b60a8ce26f"
        }
      },
      "transferOut": {
        "id": 5533662244,
        "currency": "EUR",
        "sendAmount": 15.91,
        "receiveAmount": 15.91,
        "medium": "bank",
        "mediumReceiveAccountId": 1234567 // Reference to the traders bank account
      },
      "receiptUrl": "https://trade.coinify.com/receipt/f47ac10b-58cc-4372-a562-0e02b2c3d479",
      "updateTime": "2016-04-21T12:27:36.721Z",
      "createTime": "2016-04-21T12:23:19.081Z"
    },
    {
      "id": 4415,
      "traderId": 1931,
      "state": "completed_test",
      "inCurrency": "EUR",
      "outCurrency": "BTC",
      "inAmount": 12,
      "outAmountExpected": 0.02029143,
      "transferIn": {
        "id": 9972,
        "currency": "EUR",
        "state": "completed_test",
        "sendAmount": 12.36,
        "receiveAmount": 12,
        "medium": "card",
        "details": {
          "paymentId": "28e1cc75-7729-45cb-9570-d0f9b8858df3",
          "redirectUrl": "https://coinify-verify.isignthis.com/landing/28e1cc75-7729-45cb-9570-d0f9b8858df3"
        }
      },
      "transferOut": {
        "id": 9973,
        "currency": "BTC",
        "state": "completed_test",
        "sendAmount": 0.02029143,
        "receiveAmount": 0.02029143,
        "medium": "blockchain",
        "details": {
          "account": "1CdfAUZaMB5drSC3tQBVmo6ZtX4UJhTb32"
        }
      },
      "updateTime": "2016-10-14T13:29:11.658Z",
      "createTime": "2016-10-14T13:25:40.555Z"
    },
    {
      "id": 4414,
      "traderId": 1931,
      "state": "expired",
      "inCurrency": "EUR",
      "outCurrency": "BTC",
      "inAmount": 12,
      "outAmountExpected": 0.02029067,
      "transferIn": {
        "id": 9970,
        "currency": "EUR",
        "state": "expired",
        "sendAmount": 12.36,
        "receiveAmount": 12,
        "medium": "card",
        "details": {
          "paymentId": "770a3bc9-cdd1-4b0d-b253-c607facf9f86",
          "redirectUrl": "https://coinify-verify.isignthis.com/landing/770a3bc9-cdd1-4b0d-b253-c607facf9f86"
        }
      },
      "transferOut": {
        "id": 9971,
        "currency": "BTC",
        "state": "cancelled",
        "sendAmount": 0.02029067,
        "receiveAmount": 0.02029067,
        "medium": "blockchain",
        "details": {
          "account": "1CdfAUZaMB5drSC3tQBVmo6ZtX4UJhTb32"
        }
      },
      "updateTime": "2016-10-14T13:39:45.255Z",
      "createTime": "2016-10-14T13:24:40.941Z"
    },
    {
      "id": 4411,
      "traderId": 1931,
      "state": "expired",
      "inCurrency": "EUR",
      "outCurrency": "BTC",
      "inAmount": 12,
      "outAmountExpected": 0.02018641,
      "transferIn": {
        "id": 9964,
        "currency": "EUR",
        "state": "expired",
        "sendAmount": 12.36,
        "receiveAmount": 12,
        "medium": "card",
        "details": {
          "paymentId": "351f6013-c95f-497f-adee-9b5f51d95ab4",
          "redirectUrl": "https://coinify-verify.isignthis.com/landing/351f6013-c95f-497f-adee-9b5f51d95ab4"
        }
      },
      "transferOut": {
        "id": 9965,
        "currency": "BTC",
        "state": "cancelled",
        "sendAmount": 0.02018641,
        "receiveAmount": 0.02018641,
        "medium": "blockchain",
        "details": {
          "account": "1CdfAUZaMB5drSC3tQBVmo6ZtX4UJhTb32"
        }
      },
      "updateTime": "2016-10-20T12:34:02.111Z",
      "createTime": "2016-10-14T12:33:55.897Z"
    },
    {
      "id": 4333,
      "traderId": 1931,
      "state": "completed_test",
      "inCurrency": "EUR",
      "outCurrency": "BTC",
      "inAmount": 12,
      "outAmountExpected": 0.02058959,
      "transferIn": {
        "id": 9794,
        "currency": "EUR",
        "state": "completed_test",
        "sendAmount": 12.36,
        "receiveAmount": 12,
        "medium": "card",
        "details": {
          "paymentId": "c6a00adc-238e-406a-8b57-57efe750c67b",
          "redirectUrl": "https://coinify-verify.isignthis.com/landing/c6a00adc-238e-406a-8b57-57efe750c67b"
        }
      },
      "transferOut": {
        "id": 9795,
        "currency": "BTC",
        "state": "completed_test",
        "sendAmount": 0.02058959,
        "receiveAmount": 0.02058959,
        "medium": "blockchain",
        "details": {
          "account": "1EzQseh3Q3fHmWHQ5pJD6NDpxk6du1Kd3X"
        }
      },
      "updateTime": "2016-10-11T11:13:24.616Z",
      "createTime": "2016-10-11T11:10:19.474Z"
    },
    {
      "id": 4331,
      "traderId": 1931,
      "state": "rejected",
      "inCurrency": "EUR",
      "outCurrency": "BTC",
      "inAmount": 12,
      "outAmountExpected": 0.02060521,
      "transferIn": {
        "id": 9788,
        "currency": "EUR",
        "state": "rejected",
        "sendAmount": 12.36,
        "receiveAmount": 12,
        "medium": "card",
        "details": {
          "paymentId": "1c3a8471-8e1d-42c1-a3f1-dd57ddb37d70",
          "redirectUrl": "https://coinify-verify.isignthis.com/landing/1c3a8471-8e1d-42c1-a3f1-dd57ddb37d70"
        }
      },
      "transferOut": {
        "id": 9789,
        "currency": "BTC",
        "state": "cancelled",
        "sendAmount": 0.02060521,
        "receiveAmount": 0.02060521,
        "medium": "blockchain",
        "details": {
          "account": "1EzQseh3Q3fHmWHQ5pJD6NDpxk6du1Kd3X"
        }
      },
      "updateTime": "2016-10-11T11:02:45.279Z",
      "createTime": "2016-10-11T11:02:04.284Z"
    },
    {
      "id": 4330,
      "traderId": 1931,
      "state": "expired",
      "inCurrency": "EUR",
      "outCurrency": "BTC",
      "inAmount": 12,
      "outAmountExpected": 0.02060521,
      "transferIn": {
        "id": 9786,
        "currency": "EUR",
        "state": "expired",
        "sendAmount": 12.36,
        "receiveAmount": 12,
        "medium": "card",
        "details": {
          "paymentId": "3ff6c343-275b-4d63-9070-33bb62287db7",
          "redirectUrl": "https://coinify-verify.isignthis.com/landing/3ff6c343-275b-4d63-9070-33bb62287db7"
        }
      },
      "transferOut": {
        "id": 9787,
        "currency": "BTC",
        "state": "cancelled",
        "sendAmount": 0.02060521,
        "receiveAmount": 0.02060521,
        "medium": "blockchain",
        "details": {
          "account": "1EzQseh3Q3fHmWHQ5pJD6NDpxk6du1Kd3X"
        }
      },
      "updateTime": "2016-10-11T11:16:36.644Z",
      "createTime": "2016-10-11T11:01:30.545Z"
    },
    {
      "id": 4329,
      "traderId": 1931,
      "state": "completed_test",
      "inCurrency": "EUR",
      "outCurrency": "BTC",
      "inAmount": 12,
      "outAmountExpected": 0.02059975,
      "transferIn": {
        "id": 9784,
        "currency": "EUR",
        "state": "completed_test",
        "sendAmount": 12.36,
        "receiveAmount": 12,
        "medium": "card",
        "details": {
          "paymentId": "5d802b16-8707-4321-a130-4e5206a4c001",
          "redirectUrl": "https://coinify-verify.isignthis.com/landing/5d802b16-8707-4321-a130-4e5206a4c001"
        }
      },
      "transferOut": {
        "id": 9785,
        "currency": "BTC",
        "state": "completed_test",
        "sendAmount": 0.02059975,
        "receiveAmount": 0.02059975,
        "medium": "blockchain",
        "details": {
          "account": "1EzQseh3Q3fHmWHQ5pJD6NDpxk6du1Kd3X"
        }
      },
      "updateTime": "2016-10-11T10:59:24.332Z",
      "createTime": "2016-10-11T10:57:12.285Z"
    },
    {
      "id": 4328,
      "traderId": 1931,
      "state": "expired",
      "inCurrency": "EUR",
      "outCurrency": "BTC",
      "inAmount": 12,
      "outAmountExpected": 0.02060678,
      "transferIn": {
        "id": 9782,
        "currency": "EUR",
        "state": "expired",
        "sendAmount": 12.36,
        "receiveAmount": 12,
        "medium": "card",
        "details": {
          "paymentId": "06abf0cf-5464-4353-8f2f-a73b1c655da5",
          "redirectUrl": "https://coinify-verify.isignthis.com/landing/06abf0cf-5464-4353-8f2f-a73b1c655da5"
        }
      },
      "transferOut": {
        "id": 9783,
        "currency": "BTC",
        "state": "cancelled",
        "sendAmount": 0.02060678,
        "receiveAmount": 0.02060678,
        "medium": "blockchain",
        "details": {
          "account": "1EzQseh3Q3fHmWHQ5pJD6NDpxk6du1Kd3X"
        }
      },
      "updateTime": "2016-10-17T10:52:00.644Z",
      "createTime": "2016-10-11T10:51:56.268Z"
    },
    {
      "id": 4325,
      "traderId": 1931,
      "state": "expired",
      "inCurrency": "EUR",
      "outCurrency": "BTC",
      "inAmount": 12,
      "outAmountExpected": 0.020572,
      "transferIn": {
        "id": 9776,
        "currency": "EUR",
        "state": "expired",
        "sendAmount": 12.36,
        "receiveAmount": 12,
        "medium": "card",
        "details": {
          "paymentId": "ea10ab93-22c0-4894-945b-032d68d3dbe6",
          "redirectUrl": "https://coinify-verify.isignthis.com/landing/ea10ab93-22c0-4894-945b-032d68d3dbe6"
        }
      },
      "transferOut": {
        "id": 9777,
        "currency": "BTC",
        "state": "cancelled",
        "sendAmount": 0.020572,
        "receiveAmount": 0.020572,
        "medium": "blockchain",
        "details": {
          "account": "1EzQseh3Q3fHmWHQ5pJD6NDpxk6du1Kd3X"
        }
      },
      "updateTime": "2016-10-17T09:51:32.466Z",
      "createTime": "2016-10-11T09:51:27.927Z"
    },
    {
      "id": 4324,
      "traderId": 1931,
      "state": "rejected",
      "inCurrency": "EUR",
      "outCurrency": "BTC",
      "inAmount": 12,
      "outAmountExpected": 0.02056297,
      "transferIn": {
        "id": 9774,
        "currency": "EUR",
        "state": "rejected",
        "sendAmount": 12.36,
        "receiveAmount": 12,
        "medium": "card",
        "details": {
          "paymentId": "f2dfa3d0-e4dc-4af5-885e-a3c19fcb7e8e",
          "redirectUrl": "https://coinify-verify.isignthis.com/landing/f2dfa3d0-e4dc-4af5-885e-a3c19fcb7e8e"
        }
      },
      "transferOut": {
        "id": 9775,
        "currency": "BTC",
        "state": "cancelled",
        "sendAmount": 0.02056297,
        "receiveAmount": 0.02056297,
        "medium": "blockchain",
        "details": {
          "account": "1EzQseh3Q3fHmWHQ5pJD6NDpxk6du1Kd3X"
        }
      },
      "updateTime": "2016-10-11T09:50:41.245Z",
      "createTime": "2016-10-11T09:47:06.555Z"
    },
    {
      "id": 4323,
      "traderId": 1931,
      "state": "expired",
      "inCurrency": "EUR",
      "outCurrency": "BTC",
      "inAmount": 12,
      "outAmountExpected": 0.02060421,
      "transferIn": {
        "id": 9772,
        "currency": "EUR",
        "state": "expired",
        "sendAmount": 12.36,
        "receiveAmount": 12,
        "medium": "card",
        "details": {
          "paymentId": "b0a77bd5-5c51-4ded-bc82-49d237514ce0",
          "redirectUrl": "https://coinify-verify.isignthis.com/landing/b0a77bd5-5c51-4ded-bc82-49d237514ce0"
        }
      },
      "transferOut": {
        "id": 9773,
        "currency": "BTC",
        "state": "cancelled",
        "sendAmount": 0.02060421,
        "receiveAmount": 0.02060421,
        "medium": "blockchain",
        "details": {
          "account": "1EzQseh3Q3fHmWHQ5pJD6NDpxk6du1Kd3X"
        }
      },
      "updateTime": "2016-10-17T09:40:32.099Z",
      "createTime": "2016-10-11T09:40:27.100Z"
    },
    {
      "id": 4322,
      "traderId": 1931,
      "state": "expired",
      "inCurrency": "EUR",
      "outCurrency": "BTC",
      "inAmount": 12,
      "outAmountExpected": 0.02060346,
      "transferIn": {
        "id": 9770,
        "currency": "EUR",
        "state": "expired",
        "sendAmount": 12.36,
        "receiveAmount": 12,
        "medium": "card",
        "details": {
          "paymentId": "6c2c319a-dd40-4d58-8fbf-ab32b474ef17",
          "redirectUrl": "https://coinify-verify.isignthis.com/landing/6c2c319a-dd40-4d58-8fbf-ab32b474ef17"
        }
      },
      "transferOut": {
        "id": 9771,
        "currency": "BTC",
        "state": "cancelled",
        "sendAmount": 0.02060346,
        "receiveAmount": 0.02060346,
        "medium": "blockchain",
        "details": {
          "account": "1EzQseh3Q3fHmWHQ5pJD6NDpxk6du1Kd3X"
        }
      },
      "updateTime": "2016-10-17T09:39:38.212Z",
      "createTime": "2016-10-11T09:39:31.701Z"
    },
    // safecharge trade
    {
      "id": 123123123,
      "traderId": 754035,
      "state": "awaiting_transfer_in",
      "inCurrency": "EUR",
      "outCurrency": "BTC",
      "inAmount": 12.00,
      "outAmountExpected": 0.01275487,
      "transferIn": {
        "id": 4433662222,
        "currency": "EUR",
        "sendAmount": 12.00,
        "receiveAmount": 12.00,
        "medium": "card",
        "cardPaymentId": "this-is-the-cardPaymentId-from-the-trade-object",
        "details": {
          "provider": "safecharge",
          "providerMerchantId": "07b172fb-cdf4-44d0-abf4-111a926fff7c",
          "redirectUrl": "some_url"
        }
      },
      "transferOut": {
        "id": 4433662233,
        "currency": "BTC",
        "medium": "blockchain",
        "sendAmount": 0.01275487,
        "receiveAmount": 0.01275487,
        "details": {
          // Trader's bitcoin address that will receive BTC if trade completes
          "account": "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa"
        }
      },
      "quoteExpireTime": "2017-02-13T09:54:31.785Z",
      "updateTime": "2017-02-13T09:39:38.212Z",
      "createTime": "2017-02-13T09:39:31.701Z"
    }
  ];

  if ( bearerToken.indexOf( "test kyc in cardpay" ) >= 0 ) {
    if ( bearerToken == "Bearer test kyc in cardpay 2" ) {
      let trade = Object.assign({}, response[2]);
      response = [];
      trade.state = 'completed';
      trade.inCurrency = "EUR";
      trade.outCurrency = "BTC";
      trade.transferIn.medium = "card";
      trade.transferOut.medium = "blockchain";
      const amt = 300;
      let timeOffset = (60*60*24*1000);
      for ( let i = 0; i < 3; i++ ) {
        trade.id = i + 1;
        trade.inAmount = "" + amt + ".00";
        const time = ( new Date( Date.now() - (timeOffset * (i+2) ) )).toISOString();
        trade.quoteExpireTime = time;
        trade.updateTime = time;
        trade.createTime = time;
        response.push( Object.assign({}, trade));
      }
    } if ( bearerToken == "Bearer test kyc in cardpay 3" ) {
      let trade = Object.assign({}, response[2]);
      response = [];
      trade.state = 'completed';
      trade.inCurrency = "EUR";
      trade.outCurrency = "BTC";
      trade.transferIn.medium = "card";
      trade.transferOut.medium = "blockchain";
      trade.id = 1;
      trade.inAmount = "200.00"; // spend 200 EUR, limit left is 100.
      const timeOffset = (60*60*1000); // 1 hour ago.
      const time = ( new Date( Date.now() - timeOffset )).toISOString();
      trade.quoteExpireTime = time;
      trade.updateTime = time;
      trade.createTime = time;
      response.push( Object.assign({}, trade));
    } else {
      // Add two trades to make sure what happens when its the daily 
      // limit ceiling we meet.
      response[0] = {
        "id": 1,
        "traderId": 754035,
        "state": "completed",
        "inCurrency": "EUR",
        "outCurrency": "BTC",
        "inAmount": 10.00,
        "outAmountExpected": 0.01275487,
        "transferIn": {
          "id": 4433662222,
          "currency": "EUR",
          "sendAmount": 10.00,
          "receiveAmount": 10.00,
          "medium": "card",
          "cardPaymentId": "this-is-the-cardPaymentId-from-the-trade-object",
          "details": {
            "provider": "safecharge",
            "providerMerchantId": "07b172fb-cdf4-44d0-abf4-111a926fff7c",
            "redirectUrl": "some_url"
          }
        },
        "transferOut": {
          "id": 4433662233,
          "currency": "BTC",
          "medium": "blockchain",
          "sendAmount": 0.01275487,
          "receiveAmount": 0.01275487,
          "details": {
            // Trader's bitcoin address that will receive BTC if trade completes
            "account": "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa"
          }
        },
        "quoteExpireTime": ( new Date( Date.now() - (60*10*1000) )).toISOString(),
        "updateTime": ( new Date( Date.now() - ( 60 * 10 * 1000) )).toISOString(),
        "createTime": ( new Date( Date.now() - ( 60 * 30 * 1000) )).toISOString()
      };
      const ts = ( new Date( Date.now() - (60 * 60 * 72 * 1000) ) ).toISOString();
      response[1] = {
        "id": 2,
        "traderId": 754035,
        "state": "completed",
        "inCurrency": "EUR",
        "outCurrency": "BTC",
        "inAmount": 2000.00,
        "outAmountExpected": 0.01275487,
        "transferIn": {
          "id": 4433662222,
          "currency": "EUR",
          "sendAmount": 2000.00,
          "receiveAmount": 2000.00,
          "medium": "card",
          "cardPaymentId": "this-is-the-cardPaymentId-from-the-trade-object",
          "details": {
            "provider": "safecharge",
            "providerMerchantId": "07b172fb-cdf4-44d0-abf4-111a926fff7c",
            "redirectUrl": "some_url"
          }
        },
        "transferOut": {
          "id": 4433662233,
          "currency": "BTC",
          "medium": "blockchain",
          "sendAmount": 0.01275487,
          "receiveAmount": 0.01275487,
          "details": {
            // Trader's bitcoin address that will receive BTC if trade completes
            "account": "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa"
          }
        },
        "quoteExpireTime": ts,
        "updateTime": ts,
        "createTime": ts
      };
    }
  }

  res.send( response );
});

app.get('/bank-accounts', (req, res) => {
  console.log(`/bank-accounts query`, req.query);
  console.log(`/bank-accounts Authorization header`, req.get('Authorization'));

  res.send([
    {
      // International bank example
      "id": 123, // Identifier of the bank account
      "account": {
        "type": "international", // Type of bank account
        "currency": "EUR", // Currency of the bank account
        "bic": "HIASDMIASD", // Account bic/swift/reg number depending on the type
        "number": "1234-34235-3324-2342" // Account number
      },
      "bank": {
        "name": "The International Bank", // Name of the bank (international only)
        "address": { // Address of the bank
          "street": "123 Example Street", // (international only)
          "zipcode": "12345", // (international only)
          "city": "Exampleville", // (international only)
          "state": "CA", // (international only)
          "country": "US"
        }
      },
      "holder": {
        "name": "John Smith", // Name of the account holder
        "address": { // Address of the account holder
          "street": "123 Example Street",
          "zipcode": "12345",
          "city": "Exampleville",
          "state": "CA",
          "country": "US"
        }
      },
      "update_time": "2016-07-01T12:27:36Z",
      "create_time": "2016-06-01T12:23:19Z"
    },
    {
      // International bank example 2
      "id": 1234, // Identifier of the bank account
      "account": {
        "type": "international", // Type of bank account
        "currency": "GBP", // Currency of the bank account
        "bic": "YEHSHIASD", // Account bic/swift/reg number depending on the type
        "number": "9876-9876-1234-1234" // Account number
      },
      "bank": {
        "name": "The Multinational Bank", // Name of the bank (international only)
        "address": { // Address of the bank
          "street": "987 Example Street", // (international only)
          "zipcode": "98787", // (international only)
          "city": "Cool City", // (international only)
          "state": "Pleznia", // (international only)
          "country": "PL"
        }
      },
      "holder": {
        "name": "Jane Smith", // Name of the account holder
        "address": { // Address of the account holder
          "street": "Unbergahliz 99",
          "zipcode": "65432",
          "city": "Best Very Gut City",
          "state": "Immer",
          "country": "UK"
        }
      },
      "update_time": "2016-08-04T01:26:36Z",
      "create_time": "2016-07-11T12:21:19Z"
    },
    {
      // Danish bank example
      "id": 12345, // Identifier of the bank account
      "account": {
        "type": "danish", // Type of bank account
        "currency": "DKK", // Currency of the bank account
        "bic": "6456", // Account bic/swift/reg number depending on the type
        "number": "12345435345345" // Account number
      },
      "bank": {
        "address": { // Address of the bank
          "country": "DK"
        }
      },
      "holder": {
        "name": "Hans Hansen", // Name of the account holder
        "address": { // Address of the account holder
          "street": "Humlevænget 5",
          "zipcode": "1234",
          "city": "Bumleby",
          "country": "DK"
        }
      },
      "update_time": "2016-04-01T12:27:36Z",
      "create_time": "2016-04-01T12:23:19Z"
    }
  ]);
});

app.get('/bank-accounts/:bankAccountId(\\d+)', (req, res) => {
  console.log(`/bank-accounts/${req.params.bankAccountId} query`, req.query);
  console.log(`/bank-accounts/${req.params.bankAccountId} Authorization header`, req.get('Authorization'));

  if (req.params.bankAccountId === "123456") {
    // Error example
    res.status(500).send('Something broke!')
  } else if (req.params.bankAccountId === "12345") {
    res.send({
      // International bank example
      "id": req.params.bankAccountId, // Identifier of the bank account
      "account": {
        "type": "international", // Type of bank account
        "currency": "EUR", // Currency of the bank account
        "bic": "HIASDMIASD", // Account bic/swift/reg number depending on the type
        "number": "1234-34235-3324-2342" // Account number
      },
      "bank": {
        "name": "The International Bank", // Name of the bank (international only)
        "address": { // Address of the bank
          "street": "123 Example Street", // (international only)
          "zipcode": "12345", // (international only)
          "city": "Exampleville", // (international only)
          "state": "CA", // (international only)
          "country": "US"
        }
      },
      "holder": {
        "name": "John Smith", // Name of the account holder
        "address": { // Address of the account holder
          "street": "123 Example Street",
          "zipcode": "12345",
          "city": "Exampleville",
          "state": "CA",
          "country": "US"
        }
      },
      "update_time": "2016-07-01T12:27:36Z",
      "create_time": "2016-06-01T12:23:19Z"
    });
  } else {
    // Danish bank example
    res.send({
      "id": req.params.bankAccountId, // Identifier of the bank account
      "account": {
        "type": "danish", // Type of bank account
        "currency": "DKK", // Currency of the bank account
        "bic": "6456", // Account bic/swift/reg number depending on the type
        "number": "12345435345345" // Account number
      },
      "bank": {
        "address": { // Address of the bank
          "country": "DK"
        }
      },
      "holder": {
        "name": "Hans Hansen", // Name of the account holder
        "address": { // Address of the account holder
          "street": "Humlevænget 5",
          "zipcode": "1234",
          "city": "Bumleby",
          "country": "DK"
        }
      },
      "update_time": "2016-04-01T12:27:36Z",
      "create_time": "2016-04-01T12:23:19Z"
    });
  }
});

app.delete('/bank-accounts/:bankAccountId(\\d+)', (req, res) => {
  console.log(`DELETE /bank-accounts/${req.params.bankAccountId} query`, req.query);
  console.log(`DELETE /bank-accounts/${req.params.bankAccountId} Authorization header`, req.get('Authorization'));

  // 204 No Content
  res.status(204).send();
});

/**
 * Let trader change password
 */
let userPassword = 'coinify';
app.patch('/users/me', (req, res) => {
  console.log('/users/me PATCH request:', req.body);

  if (req.body.oldPassword !== userPassword) {
    return res.status(400).send({
      error: 'wrong_password',
      error_description: 'The provided oldPassword doesn’t match the existing password.'
    });
  }

  if (!req.body.newPassword) {
    return res.status(400).send({
      error: 'invalid_request',
      error_description: 'Error in the request body.'
    });
  }

  userPassword = req.body.newPassword;

  res.send({
    "id": 12345,
    "email": "me@verygoodemailprovider85.com"
  });
});

/**
 * Get list of KYC reviews
 */
app.get('/kyc', (req, res) => {
  console.log('/kyc', req.query);
  res.send([
    {
      createTime: '2016-12-12T17:07:31.555Z',
      externalId: '2abdefc2-2b31-4c4d-ae3d-09e434a132a3',
      id: 4627,
      redirectUrl: 'https://coinify-verify.isignthis.com/landing/2abdefc2-2b31-4c4d-ae3d-09e434a132a3',
      returnUrl: 'https://www.coinify.com/trade/',
      state: 'rejected',
      updateTime: '2016-12-19T10:24:05.302Z'
    },
    {
      createTime: '2016-12-12T16:02:11.667Z',
      externalId: '1659da6c-372b-40cc-ae14-c943ef43065a',
      id: 4626,
      redirectUrl: 'https://coinify-verify.isignthis.com/landing/1659da6c-372b-40cc-ae14-c943ef43065a',
      returnUrl: 'https://www.coinify.com/trade/',
      state: 'rejected',
      updateTime: '2016-12-19T10:24:05.302Z'
    },
    {
      createTime: '2016-12-12T15:02:11.667Z',
      externalId: '1659da6c-372b-40cc-ae14-c943ef43065b',
      id: 4625,
      redirectUrl: 'https://coinify-verify.isignthis.com/landing/1659da6c-372b-40cc-ae14-c943ef43065b',
      returnUrl: 'https://www.coinify.com/trade/',
      state: 'rejected',
      updateTime: '2016-12-19T10:24:05.302Z'
    },
    {
      createTime: '2016-12-12T14:02:11.667Z',
      externalId: '1659da6c-372b-40cc-ae14-c943ef43065c',
      id: 4624,
      redirectUrl: 'https://coinify-verify.isignthis.com/landing/1659da6c-372b-40cc-ae14-c943ef43065c',
      returnUrl: 'https://www.coinify.com/trade/',
      state: 'rejected',
      updateTime: '2016-12-19T10:24:05.302Z'
    },
    {
      createTime: '2016-12-12T13:02:11.667Z',
      externalId: '1659da6c-372b-40cc-ae14-c943ef43065d',
      id: 4623,
      redirectUrl: 'https://coinify-verify.isignthis.com/landing/1659da6c-372b-40cc-ae14-c943ef43065d',
      returnUrl: 'https://www.coinify.com/trade/',
      state: 'failed',
      updateTime: '2016-12-19T10:24:05.302Z'
    },
    {
      createTime: '2016-12-12T12:02:11.667Z',
      externalId: '1659da6c-372b-40cc-ae14-c943ef43065e',
      id: 4622,
      redirectUrl: 'https://coinify-verify.isignthis.com/landing/1659da6c-372b-40cc-ae14-c943ef43065e',
      returnUrl: 'https://www.coinify.com/trade/',
      state: 'expired',
      updateTime: '2016-12-19T10:24:05.302Z'
    },
    {
      createTime: '2016-12-12T11:02:11.667Z',
      externalId: '1659da6c-372b-40cc-ae14-c943ef43065f',
      id: 4621,
      redirectUrl: 'https://coinify-verify.isignthis.com/landing/1659da6c-372b-40cc-ae14-c943ef43065f',
      returnUrl: 'https://www.coinify.com/trade/',
      state: 'expired',
      updateTime: '2016-12-19T10:24:05.302Z'
    }
  ]);
});

app.post('/card/callbacks/safecharge', (req, res) => {
  console.log('/card/callbacks/safecharge POST request:', req.body);
  res.status(200).send();
});

// Safecharge callback emulation
app.get('/callback.html', (req, res) => {
  console.log( "CALLBACK GET Page - simulating rejected payment." );
  const trade = TradeManager.getSafeChargeTrade();
  trade.state = "rejected";
  res.sendFile( __dirname + '/callback.html' );
} );

/////////////////////////////////////////////
// Start servers

// HTTPS
const secureServer = https.createServer({
    key: fs.readFileSync('server/keys/private.key'),
    cert: fs.readFileSync('server/keys/certificate.pem')
  }, app)
  .listen(HTTPS_PORT, function() {
    console.log('Fake Coinify API server listening on port ' + HTTPS_PORT);
  });

// HTTP
const insecureServer = http.createServer(app).listen(HTTP_PORT, function() {
  console.log('Insecure server listening on port ' + HTTP_PORT);
});
