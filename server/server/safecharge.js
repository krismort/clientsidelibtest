const request = require('request-promise-native');

const datetime = require('node-datetime'); //used for CurrentTimestamp and client request id
crypto = require('crypto'); //used for create hash sha256
// const Currency = require('@coinify/currency');
//consoleLogLevel = require('console-log-level');
_ = require('lodash');

const consoleLogLevel = console.log;

const dt = datetime.create();
// Current time stamp for every  Request Generation
const CURRENT_TIMESTAMP = dt.format('YmdHMS').toString();
// Unique Request Id system will integrate
const CLIENT_REQUEST_ID = dt.format('YmHMSSS').toString();

const DEFAULT_OPTIONS = {
  currentTimestamp: CURRENT_TIMESTAMP,
  clientRequestId: CLIENT_REQUEST_ID
};

const Currency = {
  toSmallestSubunit: function( totAmt, currency ) {
    return totAmt;
  },
  fromSmallestSubunit: function( amt, curr ) {
    return amt;
  }
};

function SafeCharge(options) {
  this.config = _.defaultsDeep(options, DEFAULT_OPTIONS);

  /*
   * Ensure required options provided
   */
  if (!this.config.merchantId || !this.config.merchantSiteId || !this.config.merchantSecretKey || !this.config.merchantHostURL) {
    throw new Error('Missing configuration options');
  }

  /*
   * Set default logger if none provided
   */
  this.log = options.log || consoleLogLevel({});
}


// function for calculating checksum
function calculateChecksum(jsonparams) {
  let concatinatedParam = '';
  //Concatenate all value of array
  jsonparams.forEach(function (value) {
    concatinatedParam = concatinatedParam + value;
  });
  // generate Hash for given string
  const geteratedHashCheckSumt = crypto.createHash('sha256').update(concatinatedParam).digest('hex').toString('utf-8');
  // hash value of given hash function
  return geteratedHashCheckSumt;
}

////// Session & Tokenization Methods //////

// Get Session Token
SafeCharge.prototype.getSessionToken = async function getSessionToken() {

  //Param validation
  if (!this.config.merchantId || !this.config.merchantSiteId || !this.config.merchantSecretKey || !this.config.merchantHostURL) {
    throw new Error('Params are missing');
  }

  const TIMESTAMP = dt.format('YmdHMS').toString();
  const REQUEST_ID = crypto.randomBytes(3*4).toString('base64');

  //Create Array For CheckSum
  const arrayParamToken =[this.config.merchantId, this.config.merchantSiteId, REQUEST_ID, TIMESTAMP, this.config.merchantSecretKey];

  // create json array for Token Request
  const optionsSessionToken = {
    method: 'POST',
    url: 'https://' + this.config.merchantHostURL + '/ppp/api/v1/getSessionToken.do',
    headers: {
      'content-type': 'application/json'
    },
    body: {
      merchantId: this.config.merchantId,
      merchantSiteId: this.config.merchantSiteId,
      clientRequestId: REQUEST_ID,
      timeStamp: TIMESTAMP,
      checksum: calculateChecksum(arrayParamToken)
    },
    json: true
  };

  //console.log( "REQUEST : ", optionsSessionToken );

  const res = await
    doGetSessionToken(optionsSessionToken);

  return res;
};

function doGetSessionToken(optionsSessionToken) {

  return new Promise(function (resolve, reject) {


    request(optionsSessionToken, function (error, response, body) {
      if (error) {
        reject('Unable to connect to server');
      } else {
        resolve(body);
      }
    });
  });
}

//Card Tokenization
SafeCharge.prototype.cardTokenization = async function cardTokenization(arryoption) {

  //Param validation
  if (!this.config.merchantId || !this.config.merchantSiteId || !this.config.merchantSecretKey || !this.config.merchantHostURL ||
    !arryoption.cardData.cardNumber || !arryoption.cardData.cardHolderName || !arryoption.cardData.expirationMonth || !arryoption.cardData.expirationYear || !arryoption.cardData.CVV) {
    throw new Error('Params are missing');
  }

  //make array for Card Tokenization
  const optionarray = {
    method: 'POST',
    url: 'https://' + this.config.merchantHostURL + '/ppp/api/v1/cardTokenization.do',
    headers: {
      'content-type': 'application/json'
    },
    body: {
      sessionToken: arryoption.sessionToken,
      userTokenId: arryoption.userTokenId,
      cardData: {
        cardNumber: arryoption.cardData.cardNumber,
        cardHolderName: arryoption.cardData.cardHolderName,
        expirationMonth: arryoption.cardData.expirationMonth,
        expirationYear: arryoption.cardData.expirationYear,
        CVV: arryoption.cardData.CVV
      }
    },
    json: true
  };

  console.log( "REQUEST ", optionarray.body );

  const res = await
    doCardTokenization(optionarray);

  return res;
};


function doCardTokenization(optionarray) {

  return new Promise(function (resolve, reject) {

    request(optionarray, function (error, response, body) {

      if (error) {
        reject('Unable to connect to server');
      } else {
        resolve(body);
      }
    });

  });
}

////// User Section //////

// Create User
SafeCharge.prototype.createUser = async function createUser(arrCreateUser) {

  //Param validation
  if (!this.config.merchantId || !this.config.merchantSiteId || !this.config.merchantSecretKey || !this.config.merchantHostURL ||
    !arrCreateUser.userDetail.userTokenId || !arrCreateUser.clientRequestId ||
    !arrCreateUser.userDetail.firstName || !arrCreateUser.userDetail.lastName || !arrCreateUser.userDetail.address || !arrCreateUser.userDetail.state || !arrCreateUser.userDetail.city || !arrCreateUser.userDetail.zip || !arrCreateUser.userDetail.countryCode || !arrCreateUser.userDetail.phone
    || !arrCreateUser.userDetail.locale || !arrCreateUser.userDetail.email
  ) {
    throw new Error('Params are missing');
  }

  const TIMESTAMP = dt.format('YmdHMS').toString();

  // create array for calculate checksum
  const createUsernCheckSumarray = [this.config.merchantId, this.config.merchantSiteId, arrCreateUser.userDetail.userTokenId, arrCreateUser.clientRequestId, arrCreateUser.userDetail.firstName, arrCreateUser.userDetail.lastName, arrCreateUser.userDetail.address, arrCreateUser.userDetail.state, arrCreateUser.userDetail.city, arrCreateUser.userDetail.zip, arrCreateUser.userDetail.countryCode, arrCreateUser.userDetail.phone, arrCreateUser.userDetail.locale, arrCreateUser.userDetail.email, '', TIMESTAMP, this.config.merchantSecretKey];

  const optionCreateUser = {
    method: 'POST',
    url: 'https://' + this.config.merchantHostURL + '/ppp/api/v1/createUser.do',
    headers: {
      'content-type': 'application/json'
    },
    body: {
      merchantId: this.config.merchantId,
      merchantSiteId: this.config.merchantSiteId,
      userTokenId: arrCreateUser.userDetail.userTokenId,
      clientRequestId: arrCreateUser.clientRequestId,
      firstName: arrCreateUser.userDetail.firstName,
      lastName: arrCreateUser.userDetail.lastName,
      address: arrCreateUser.userDetail.address,
      state: arrCreateUser.userDetail.state,
      city: arrCreateUser.userDetail.city,
      zip: arrCreateUser.userDetail.zip,
      countryCode: arrCreateUser.userDetail.countryCode,
      phone: arrCreateUser.userDetail.phone,
      locale: arrCreateUser.userDetail.locale,
      email: arrCreateUser.userDetail.email,
      timeStamp: TIMESTAMP,
      checksum: calculateChecksum(createUsernCheckSumarray)
    },
    json: true
  };

  const res = await
    doCreateUser(optionCreateUser);

  return res;
};

function doCreateUser(optionarray) {

  return new Promise(function (resolve, reject) {

    request(optionarray, function (error, response, body) {

      if (error) {
        reject('Unable to connect to server');
      } else {
        resolve(body);
      }
    });
  });
}

// Update User
SafeCharge.prototype.updateUser = async function updateUser(arrUpdateUser) {

  //Param validation
  if (!this.config.merchantId || !this.config.merchantSiteId || !this.config.merchantSecretKey || !this.config.merchantHostURL ||
    !arrUpdateUser.userDetail.userTokenId || !arrUpdateUser.clientRequestId ||
    !arrUpdateUser.userDetail.firstName || !arrUpdateUser.userDetail.lastName || !arrUpdateUser.userDetail.address || !arrUpdateUser.userDetail.state || !arrUpdateUser.userDetail.city || !arrUpdateUser.userDetail.zip || !arrUpdateUser.userDetail.countryCode || !arrUpdateUser.userDetail.phone
    || !arrUpdateUser.userDetail.locale || !arrUpdateUser.userDetail.email
  ) {
    throw new Error('Params are missing');
  }

  const TIMESTAMP = dt.format('YmdHMS').toString();

  // create array for calculate checksum
  const updateUsernCheckSumarray = [this.config.merchantId, this.config.merchantSiteId, arrUpdateUser.userDetail.userTokenId, arrUpdateUser.clientRequestId, arrUpdateUser.userDetail.firstName, arrUpdateUser.userDetail.lastName, arrUpdateUser.userDetail.address, arrUpdateUser.userDetail.state, arrUpdateUser.userDetail.city, arrUpdateUser.userDetail.zip, arrUpdateUser.userDetail.countryCode, arrUpdateUser.userDetail.phone, arrUpdateUser.userDetail.locale, arrUpdateUser.userDetail.email, '', TIMESTAMP, this.config.merchantSecretKey];

  const optionUpdateUser = {
    method: 'POST',
    url: 'https://' + this.config.merchantHostURL + '/ppp/api/v1/updateUser.do',
    headers: {
      'content-type': 'application/json'
    },
    body: {
      merchantId: this.config.merchantId,
      merchantSiteId: this.config.merchantSiteId,
      userTokenId: arrUpdateUser.userDetail.userTokenId,
      clientRequestId: arrUpdateUser.clientRequestId,
      firstName: arrUpdateUser.userDetail.firstName,
      lastName: arrUpdateUser.userDetail.lastName,
      address: arrUpdateUser.userDetail.address,
      state: arrUpdateUser.userDetail.state,
      city: arrUpdateUser.userDetail.city,
      zip: arrUpdateUser.userDetail.zip,
      countryCode: arrUpdateUser.userDetail.countryCode,
      phone: arrUpdateUser.userDetail.phone,
      locale: arrUpdateUser.userDetail.locale,
      email: arrUpdateUser.userDetail.email,
      timeStamp: TIMESTAMP,
      checksum: calculateChecksum(updateUsernCheckSumarray)
    },
    json: true
  };
  const res = await
    doUpdateUser(optionUpdateUser);

  return res;
};

function doUpdateUser(optionarray) {

  return new Promise(function (resolve, reject) {

    request(optionarray, function (error, response, body) {

      if (error) {
        reject('Unable to connect to server');
      } else {
        resolve(body);
      }
    });
  });
}

//Get User Details
SafeCharge.prototype.getUserDetails = async function getUserDetails(arrGetUser) {

  //Param validation
  if (!this.config.merchantId || !this.config.merchantSiteId || !this.config.merchantSecretKey || !this.config.merchantHostURL ||
    !arrGetUser.userDetail.userTokenId || !arrGetUser.clientRequestId) {
    throw new Error('Params are missing');
  }

  const TIMESTAMP = dt.format('YmdHMS').toString();

  // create array for calculate checksum
  const geteUserCheckSumarray = [this.config.merchantId, this.config.merchantSiteId, arrGetUser.userDetail.userTokenId, arrGetUser.clientRequestId, TIMESTAMP, this.config.merchantSecretKey];

  const optionGetUser = {
    method: 'POST',
    url: 'https://' + this.config.merchantHostURL + '/ppp/api/v1/getUserDetails.do',
    headers: {
      'content-type': 'application/json'
    },
    body: {
      merchantId: this.config.merchantId,
      merchantSiteId: this.config.merchantSiteId,
      userTokenId: arrGetUser.userDetail.userTokenId,
      clientRequestId: arrGetUser.clientRequestId,
      timeStamp: TIMESTAMP,
      checksum: calculateChecksum(geteUserCheckSumarray)
    },
    json: true
  };

  const res = await
    doGetUserDetails(optionGetUser);

  return res;
};

function doGetUserDetails(optionarray) {

  return new Promise(function (resolve, reject) {

    request(optionarray, function (error, response, body) {

      if (error) {
        reject('Unable to connect to server');
      } else {
        resolve(body);
      }
    });
  });
}

////// Payment Section //////

// function for dynamic 3D
SafeCharge.prototype.dynamic3D = async function dynamic3D(arrDynamic3DParams) {

  //Param validation
  if (!this.config.merchantId || !this.config.merchantSiteId || !this.config.merchantSecretKey || !this.config.merchantHostURL ||
    !arrDynamic3DParams.clientUniqueId || !arrDynamic3DParams.notificationUrl || !arrDynamic3DParams.deviceDetails.deviceType ||
    !arrDynamic3DParams.transaction.amount || !arrDynamic3DParams.deviceDetails.deviceName || !arrDynamic3DParams.transaction.currency || !arrDynamic3DParams.deviceDetails.deviceOS ||
    !arrDynamic3DParams.transaction.reference || !arrDynamic3DParams.deviceDetails.browser || !arrDynamic3DParams.deviceDetails.ipAddress ||
    !arrDynamic3DParams.billingAddress.firstName || !arrDynamic3DParams.billingAddress.lastName || !arrDynamic3DParams.billingAddress.country || !arrDynamic3DParams.billingAddress.email
  ) {
    console.error("Params for dynamic3D are missing; ", arrDynamic3DParams );
    throw new Error('Params are missing ' );
  }

  const TIMESTAMP = dt.format('YmdHMS').toString();
  const REQUEST_ID = crypto.randomBytes(3*4).toString('base64');

  //const REQUEST_ID = crypto.randomBytes(3*4).toString('base64');
  
  const arrayParam3DToken = [this.config.merchantId, this.config.merchantSiteId, REQUEST_ID, arrDynamic3DParams.transaction.amount, arrDynamic3DParams.transaction.currency, TIMESTAMP, this.config.merchantSecretKey];


  // request option array for dynamic 3D

  let optionsdynamic3D;

  if (!arrDynamic3DParams.userPaymentOption || !arrDynamic3DParams.userPaymentOption.userPaymentOptionId || !arrDynamic3DParams.userPaymentOption.CVV) {

    optionsdynamic3D = {
      method: 'POST',
      url: 'https://' + this.config.merchantHostURL + '/ppp/api/v1/dynamic3D.do', //Request URL
      headers: {
        'content-type': 'application/json'
      },
      body: {
        sessionToken: arrDynamic3DParams.sessionToken,
        merchantId: this.config.merchantId,
        merchantSiteId: this.config.merchantSiteId,
        clientUniqueId: arrDynamic3DParams.clientUniqueId,
        clientRequestId: REQUEST_ID,
        isDynamic3D: 1,
        dynamic3DMode: 'ON',
        currency: arrDynamic3DParams.transaction.currency, //The three character ISO currency code.
        amount: arrDynamic3DParams.transaction.amount,
        amountDetails: {
          totalShipping: 0,
          totalHandling: 0,
          totalDiscount: 0,
          totalTax: 0
        },
        items: [{
          name: arrDynamic3DParams.transaction.reference,
          price: arrDynamic3DParams.transaction.amount,
          quantity: 1
        }],
        deviceDetails: { // Device Detail
          deviceType: arrDynamic3DParams.deviceDetails.deviceType,
          deviceName: arrDynamic3DParams.deviceDetails.deviceName,
          deviceOS: arrDynamic3DParams.deviceDetails.deviceOS,
          browser: arrDynamic3DParams.deviceDetails.browser,
          ipAddress: arrDynamic3DParams.deviceDetails.ipAddress
        },
        billingAddress: { //user billing address
          firstName: arrDynamic3DParams.billingAddress.firstName,
          lastName: arrDynamic3DParams.billingAddress.lastName,
          country: arrDynamic3DParams.billingAddress.country,
          email: arrDynamic3DParams.billingAddress.email
        },
        cardData: {
          cardNumber: '',
          cardHolderName: arrDynamic3DParams.cardData.cardHolderName,
          CVV: arrDynamic3DParams.cardData.CVV,
          ccTempToken: arrDynamic3DParams.cardData.ccTempToken
        },
        urlDetails: { //url detail where you get response detail
          notificationUrl: arrDynamic3DParams.notificationUrl
        },
        merchantDetails: {
          customField1: arrDynamic3DParams.clientUniqueId
        },
        timeStamp: TIMESTAMP,
        checksum: calculateChecksum(arrayParam3DToken)
      },
      json: true
    };
  } else {
    console.log( "args: ", arrayParam3DToken ,  "; CHECKSUM ", calculateChecksum(arrayParam3DToken) );
    if ( !arrDynamic3DParams.userTokenId ) {
      throw new Error( "!userTokenId");
    }
    optionsdynamic3D = {
      method: 'POST',
      url: 'https://' + this.config.merchantHostURL + '/ppp/api/v1/dynamic3D.do', //Request URL
      headers: {
        'content-type': 'application/json'
      },
      body: {
        sessionToken: arrDynamic3DParams.sessionToken,
        merchantId: this.config.merchantId,
        merchantSiteId: this.config.merchantSiteId,
        clientUniqueId: arrDynamic3DParams.clientUniqueId,
        clientRequestId: REQUEST_ID,
        userTokenId: arrDynamic3DParams.userTokenId,
        isDynamic3D: 1,
        dynamic3DMode: 'ON',
        currency: arrDynamic3DParams.transaction.currency, //The three character ISO currency code.
        amount: arrDynamic3DParams.transaction.amount,
        amountDetails: {
          totalShipping: 0,
          totalHandling: 0,
          totalDiscount: 0,
          totalTax: 0
        },
        items: [{
          name: arrDynamic3DParams.transaction.reference,
          price: arrDynamic3DParams.transaction.amount,
          quantity: 1
        }],
        deviceDetails: { // Device Detail
          deviceType: arrDynamic3DParams.deviceDetails.deviceType,
          deviceName: arrDynamic3DParams.deviceDetails.deviceName,
          deviceOS: arrDynamic3DParams.deviceDetails.deviceOS,
          browser: arrDynamic3DParams.deviceDetails.browser,
          ipAddress: arrDynamic3DParams.deviceDetails.ipAddress
        },
        billingAddress: { //user billing address
          firstName: arrDynamic3DParams.billingAddress.firstName,
          lastName: arrDynamic3DParams.billingAddress.lastName,
          country: arrDynamic3DParams.billingAddress.country,
          email: arrDynamic3DParams.billingAddress.email
        },
        userPaymentOption: {
          userPaymentOptionId: arrDynamic3DParams.userPaymentOption.userPaymentOptionId,
          CVV: arrDynamic3DParams.userPaymentOption.CVV
        },
        urlDetails: { //url detail where you get response detail
          notificationUrl: arrDynamic3DParams.notificationUrl
        },
        merchantDetails: {
          customField1: arrDynamic3DParams.clientUniqueId
        },
        timeStamp: TIMESTAMP,
        checksum: calculateChecksum(arrayParam3DToken)
      },
      json: true
    };
  }
  const res = await
    doDynamic3D(optionsdynamic3D);
  return res;
};

function doDynamic3D(optionarray) {

  return new Promise(function (resolve, reject) {

    request(optionarray, function (error, response, body) {

      if (error) {
        reject('Unable to connect to server');
      } else {
        resolve(body);
      }
    });
  });
}

// function for payment 3D
SafeCharge.prototype.payment3D = async function payment3D(arrPayment3DParams) {

  //Param validation
  if (!this.config.merchantId || !this.config.merchantSiteId || !this.config.merchantSecretKey || !this.config.merchantHostURL ||
    !arrPayment3DParams.sessionToken || !arrPayment3DParams.transaction.orderId || !arrPayment3DParams.clientRequestId ||
    !arrPayment3DParams.clientUniqueId || !arrPayment3DParams.notificationUrl || !arrPayment3DParams.deviceDetails.deviceType ||
    !arrPayment3DParams.transaction.amount || !arrPayment3DParams.deviceDetails.deviceName ||
    !arrPayment3DParams.transaction.currency || !arrPayment3DParams.deviceDetails.deviceOS ||
    !arrPayment3DParams.transaction.reference || !arrPayment3DParams.deviceDetails.browser ||
    !arrPayment3DParams.transaction.transactionType || !arrPayment3DParams.deviceDetails.ipAddress ||
    !arrPayment3DParams.billingAddress.firstName || !arrPayment3DParams.billingAddress.lastName ||
    !arrPayment3DParams.billingAddress.country || !arrPayment3DParams.billingAddress.email ||
    !arrPayment3DParams.userPaymentOption || !arrPayment3DParams.userTokenId
  ) {
    throw new Error('Params are missing');
  }

  const TIMESTAMP = dt.format('YmdHMS').toString();

  const arrayParam3DToken = [this.config.merchantId, this.config.merchantSiteId, arrPayment3DParams.clientRequestId, arrPayment3DParams.transaction.amount, arrPayment3DParams.transaction.currency, TIMESTAMP, this.config.merchantSecretKey];

  let optionsPayment3D;

  if (!arrPayment3DParams.userPaymentOption || !arrPayment3DParams.userPaymentOption.userPaymentOptionId || !arrPayment3DParams.userPaymentOption.CVV) {
    throw new Error( "Should not be called - KM says");
    optionsPayment3D = {
      method: 'POST',
      url: 'https://' + this.config.merchantHostURL + '/ppp/api/v1/payment3D.do',
      headers: {
        'content-type': 'application/json'
      },
      body: {
        sessionToken: arrPayment3DParams.sessionToken, //received by dynamic 3D response
        orderId: arrPayment3DParams.transaction.orderId, //received by dynamic 3D response
        merchantId: this.config.merchantId,
        merchantSiteId: this.config.merchantSiteId,
        clientUniqueId: arrPayment3DParams.clientUniqueId, //received by dynamic 3D response
        clientRequestId: arrPayment3DParams.clientRequestId, //received by dynamic 3D response
        transactionType: arrPayment3DParams.transaction.transactionType, // Auth ,Sale
        paResponse: arrPayment3DParams.transaction.paResponse, // Paresponse received on url by submition of pa Request
        currency: arrPayment3DParams.transaction.currency, // currency will be
        amount: arrPayment3DParams.transaction.amount,
        amountDetails: { //amount detail
          totalShipping: 0,
          totalHandling: 0,
          totalDiscount: 0,
          totalTax: 0
        },
        items: [{
          name: arrPayment3DParams.transaction.reference, //payment reference
          price: arrPayment3DParams.transaction.amount, //amount
          quantity: 1
        }],
        deviceDetails: { // Device detail
          deviceType: arrPayment3DParams.deviceDetails.deviceType,
          deviceName: arrPayment3DParams.deviceDetails.deviceName,
          deviceOS: arrPayment3DParams.deviceDetails.deviceOS,
          browser: arrPayment3DParams.deviceDetails.browser,
          ipAddress: arrPayment3DParams.deviceDetails.ipAddress
        },

        billingAddress: { //user billing detail
          firstName: arrPayment3DParams.billingAddress.firstName,
          lastName: arrPayment3DParams.billingAddress.lastName,
          country: arrPayment3DParams.billingAddress.country,
          email: arrPayment3DParams.billingAddress.email
        },
        cardData: { //user card data
          cardNumber: '',
          cardHolderName: arrPayment3DParams.cardData.cardHolderName,
          CVV: arrPayment3DParams.cardData.CVV,
          ccTempToken: arrPayment3DParams.cardData.ccTempToken
        },
        urlDetails: { // notify url Detail
          notificationUrl: arrPayment3DParams.notificationUrl
        },
        merchantDetails: {
          customField1: arrPayment3DParams.clientUniqueId
        },
        timeStamp: TIMESTAMP, //current Timestamp detail
        checksum: calculateChecksum(arrayParam3DToken)
      },
      json: true
    };
  } else {
    const args = {
      sessionToken: arrPayment3DParams.sessionToken, //received by dynamic 3D response
      orderId: arrPayment3DParams.transaction.orderId, //received by dynamic 3D response
      merchantId: this.config.merchantId,
      merchantSiteId: this.config.merchantSiteId,
      userTokenId: arrPayment3DParams.userTokenId,
      clientUniqueId: arrPayment3DParams.clientUniqueId, //received by dynamic 3D response
      clientRequestId: arrPayment3DParams.clientRequestId, //received by dynamic 3D response
      transactionType: arrPayment3DParams.transaction.transactionType, // Auth ,Sale
      paResponse: arrPayment3DParams.transaction.paResponse, // Paresponse received on url by submition of pa Request
      currency: arrPayment3DParams.transaction.currency, // currency will be
      amount: arrPayment3DParams.transaction.amount,
      amountDetails: { //amount detail
        totalShipping: 0,
        totalHandling: 0,
        totalDiscount: 0,
        totalTax: 0
      },
      items: [{
        name: arrPayment3DParams.transaction.reference, //payment reference
        price: arrPayment3DParams.transaction.amount, //amount
        quantity: 1
      }],
      deviceDetails: { // Device detail
        deviceType: arrPayment3DParams.deviceDetails.deviceType,
        deviceName: arrPayment3DParams.deviceDetails.deviceName,
        deviceOS: arrPayment3DParams.deviceDetails.deviceOS,
        browser: arrPayment3DParams.deviceDetails.browser,
        ipAddress: arrPayment3DParams.deviceDetails.ipAddress
      },
      billingAddress: { //user billing detail
        firstName: arrPayment3DParams.billingAddress.firstName,
        lastName: arrPayment3DParams.billingAddress.lastName,
        country: arrPayment3DParams.billingAddress.country,
        email: arrPayment3DParams.billingAddress.email
      },
      userPaymentOption: {
        userPaymentOptionId: arrPayment3DParams.userPaymentOption.userPaymentOptionId,
        CVV: arrPayment3DParams.userPaymentOption.CVV
      },
      urlDetails: { // notify url Detail
        notificationUrl: arrPayment3DParams.notificationUrl
      },
      merchantDetails: {
        customField1: arrPayment3DParams.clientUniqueId
      },
      timeStamp: TIMESTAMP, //current Timestamp detail
      checksum: calculateChecksum(arrayParam3DToken)
    };
    console.log( "ARGS ", args );
    optionsPayment3D = {
      method: 'POST',
      url: 'https://' + this.config.merchantHostURL + '/ppp/api/v1/payment3D.do',
      headers: {
        'content-type': 'application/json'
      },
      body: args,
      json: true
    };
  }
  const res = await
    doPayment3D(optionsPayment3D);
  return res;
};

function doPayment3D(optionarray) {

  return new Promise(function (resolve, reject) {

    request(optionarray, function (error, response, body) {

      if (error) {
        reject('Unable to connect to server');
      } else {
        resolve(body);
      }
    });
  });
}

// Refund Transaction function
SafeCharge.prototype.refundTransaction = async function refundTransaction(arrRefundTransactionParams) {

  //Param validation
  if (!this.config.merchantId || !this.config.merchantSiteId || !this.config.merchantSecretKey || !this.config.merchantHostURL ||
    !arrRefundTransactionParams.clientUniqueId || !arrRefundTransactionParams.clientRequestId || !arrRefundTransactionParams.notificationUrl ||
    !arrRefundTransactionParams.transaction.amount || !arrRefundTransactionParams.transaction.currency || !arrRefundTransactionParams.transaction.relatedTransactionId || !arrRefundTransactionParams.transaction.authCode ||
    !arrRefundTransactionParams.transaction.comment) {
    throw new Error('Params are missing');
  }

  const TIMESTAMP = dt.format('YmdHMS').toString();

  // create array for calculate checksum
  const refundTransactionCheckSumarray = [this.config.merchantId, this.config.merchantSiteId, arrRefundTransactionParams.clientRequestId, arrRefundTransactionParams.clientUniqueId, arrRefundTransactionParams.transaction.amount, arrRefundTransactionParams.transaction.currency, arrRefundTransactionParams.transaction.relatedTransactionId, arrRefundTransactionParams.transaction.authCode, arrRefundTransactionParams.transaction.comment, arrRefundTransactionParams.notificationUrl, TIMESTAMP, this.config.merchantSecretKey];

  const optionarray = {
    method: 'POST',
    url: 'https://' + this.config.merchantHostURL + '/ppp/api/v1/refundTransaction.do',
    headers: {
      'content-type': 'application/json'
    },
    body: {
      merchantId: this.config.merchantId,
      merchantSiteId: this.config.merchantSiteId,
      clientUniqueId: arrRefundTransactionParams.clientUniqueId, //received by safecharge payment request
      clientRequestId: arrRefundTransactionParams.clientRequestId, //received by safecharge payment request
      amount: arrRefundTransactionParams.transaction.amount,
      currency: arrRefundTransactionParams.transaction.currency,
      relatedTransactionId: arrRefundTransactionParams.transaction.relatedTransactionId, //received by safecharge payment request
      authCode: arrRefundTransactionParams.transaction.authCode, //received by safecharge payment request
      comment: arrRefundTransactionParams.transaction.comment, //its optional to about reason

      urlDetails: { // notify URL
        notificationUrl: arrRefundTransactionParams.notificationUrl
      },
      merchantDetails: {
        customField1: arrRefundTransactionParams.clientUniqueId
      },
      timeStamp: TIMESTAMP,
      checksum: calculateChecksum(refundTransactionCheckSumarray)
    },
    json: true
  };

  const res = await
    doRefundTransaction(optionarray);

  return res;
};

function doRefundTransaction(optionarray) {

  return new Promise(function (resolve, reject) {

    request(optionarray, function (error, response, body) {

      if (error) {
        reject('Unable to connect to server');
      } else {
        resolve(body);
      }
    });
  });
}

// Void Transaction
SafeCharge.prototype.voidTransaction = async function voidTransaction(arrVoidTransactionParams) {

  //Param validation
  if (!this.config.merchantId || !this.config.merchantSiteId || !this.config.merchantSecretKey || !this.config.merchantHostURL ||
    !arrVoidTransactionParams.internalPaymentId ||
    !arrVoidTransactionParams.amount || !arrVoidTransactionParams.currency || !arrVoidTransactionParams.externalId || !arrVoidTransactionParams.authCode)
  {
    throw new Error('Params are missing');
  }

  const TIMESTAMP = dt.format('YmdHMS').toString();
  const CLIENT_REQUEST_ID = crypto.randomBytes(16).toString('hex');
  const VOID_PAYMENT_COMMENT = 'Payment Voided'; // We are using Static Void Message
  const AMOUNT = Currency.fromSmallestSubunit(arrVoidTransactionParams.amount, arrVoidTransactionParams.currency);
  // create array for calculate checksum
  const voidTransactionCheckSumarray = [this.config.merchantId, this.config.merchantSiteId, CLIENT_REQUEST_ID, arrVoidTransactionParams.internalPaymentId, AMOUNT, arrVoidTransactionParams.currency, arrVoidTransactionParams.externalId, arrVoidTransactionParams.authCode, VOID_PAYMENT_COMMENT, '', TIMESTAMP, this.config.merchantSecretKey];

  const optionarray = {
    method: 'POST',
    url: 'https://' + this.config.merchantHostURL + '/ppp/api/v1/voidTransaction.do',
    headers: {
      'content-type': 'application/json'
    },
    body: {
      merchantId: this.config.merchantId,
      merchantSiteId: this.config.merchantSiteId,
      clientUniqueId: arrVoidTransactionParams.internalPaymentId,
      clientRequestId: CLIENT_REQUEST_ID,
      amount: AMOUNT,
      currency: arrVoidTransactionParams.currency,
      relatedTransactionId: arrVoidTransactionParams.externalId,
      authCode: arrVoidTransactionParams.authCode, //received by safecharge payment request
      comment: VOID_PAYMENT_COMMENT,
      urlDetails: {
        notificationUrl: ''
      },
      merchantDetails: {
        customField1: arrVoidTransactionParams.internalPaymentId
      },
      timeStamp: TIMESTAMP,
      checksum: calculateChecksum(voidTransactionCheckSumarray)
    },
    json: true
  };

  const res = await
    doVoidTransaction(optionarray);

  return res;
};

function doVoidTransaction(optionarray) {
  return new Promise(function (resolve, reject) {

    request(optionarray, function (error, response, body) {

      if (error) {
        reject('Unable to connect to server');
      } else {
        if(body.status === 'SUCCESS')
        {
          return resolve(body);
        }
        reject(body); //return error reason
      }
    });
  });
}


///// UPO Section /////

//Add UPO By CCTempToken
SafeCharge.prototype.addUPOCreditCardByTempToken = async function addUPOCreditCardByTempToken(arryoption) {

  //Param validation
  if (!this.config.merchantId || !this.config.merchantSiteId || !this.config.merchantSecretKey || !this.config.merchantHostURL ||
    !arryoption.sessionToken || !arryoption.userTokenId || !arryoption.clientRequestId || !arryoption.ccTempToken) {
    throw new Error('Params are missing');
  }

  const TIMESTAMP = dt.format('YmdHMS').toString();

  //For token creation create array to pass  calculateChecksum
  const arrayParamToken = [this.config.merchantId, this.config.merchantSiteId, arryoption.clientRequestId, TIMESTAMP, this.config.merchantSecretKey];

  const optionarray = {
    method: 'POST',
    url: 'https://' + this.config.merchantHostURL + '/ppp/api/v1/addUPOCreditCardByTempToken.do',
    headers: {
      'content-type': 'application/json'
    },
    body: {
      merchantId: this.config.merchantId,
      merchantSiteId: this.config.merchantSiteId,
      clientRequestId: arryoption.clientRequestId,
      sessionToken: arryoption.sessionToken,
      userTokenId: arryoption.userTokenId,
      ccTempToken: arryoption.ccTempToken,
      timeStamp: TIMESTAMP,
      checksum: calculateChecksum(arrayParamToken)
    },
    json: true
  };

  const res = await
    doAddUPOCreditCardByTempToken(optionarray);

  return res;
};

function doAddUPOCreditCardByTempToken(optionarray) {

  return new Promise(function (resolve, reject) {

    request(optionarray, function (error, response, body) {

      if (error) {
        reject('Unable to connect to server');
      } else {
        resolve(body);
      }
    });
  });
}


//Edit UPO CC
SafeCharge.prototype.editUPOCC = async function editUPOCC(arryoption) {

  //Param validation
  if (!this.config.merchantId || !this.config.merchantSiteId || !this.config.merchantSecretKey || !this.config.merchantHostURL ||
    !arryoption.userTokenId || !arryoption.clientRequestId || !arryoption.userPaymentOptionId || !arryoption.ccExpMonth || !arryoption.ccExpYear || !arryoption.ccNameOnCard) {
    throw new Error('Params are missing');
  }

  const TIMESTAMP = dt.format('YmdHMS').toString();

  //Create Array For CheckSum
  const arrayParamToken = [this.config.merchantId, this.config.merchantSiteId, arryoption.userTokenId, arryoption.clientRequestId, arryoption.userPaymentOptionId, arryoption.ccExpMonth, arryoption.ccExpYear, arryoption.ccNameOnCard, TIMESTAMP, this.config.merchantSecretKey];

  const optionarray = {
    method: 'POST',
    url: 'https://' + this.config.merchantHostURL + '/ppp/api/v1/editUPOCC.do',
    headers: {
      'content-type': 'application/json'
    },
    body: {
      merchantId: this.config.merchantId,
      merchantSiteId: this.config.merchantSiteId,
      userTokenId: arryoption.userTokenId,
      clientRequestId: arryoption.clientRequestId,
      userPaymentOptionId: arryoption.userPaymentOptionId,
      ccExpMonth: arryoption.ccExpMonth,
      ccExpYear: arryoption.ccExpYear,
      ccNameOnCard: arryoption.ccNameOnCard,
      timeStamp: TIMESTAMP,
      checksum: calculateChecksum(arrayParamToken)
    },
    json: true
  };

  const res = await
    doEditUPOCC(optionarray);

  return res;
};

function doEditUPOCC(optionarray) {

  return new Promise(function (resolve, reject) {

    request(optionarray, function (error, response, body) {

      if (error) {
        reject('Unable to connect to server');
      } else {
        resolve(body);
      }
    });
  });
}


//Delete UPO
SafeCharge.prototype.deleteUPO = async function deleteUPO(arryoption) {

  //Param validation
  if (!this.config.merchantId || !this.config.merchantSiteId || !this.config.merchantSecretKey || !this.config.merchantHostURL ||
    !arryoption.userTokenId || !arryoption.clientRequestId || !arryoption.userPaymentOptionId) {
    throw new Error('Params are missing');
  }

  const TIMESTAMP = dt.format('YmdHMS').toString();

  //Create Array For CheckSum
  const arrayParamToken = [this.config.merchantId, this.config.merchantSiteId, arryoption.userTokenId, arryoption.clientRequestId, arryoption.userPaymentOptionId, TIMESTAMP, this.config.merchantSecretKey];

  const optionarray = {
    method: 'POST',
    url: 'https://' + this.config.merchantHostURL + '/ppp/api/v1/deleteUPO.do',
    headers: {
      'content-type': 'application/json'
    },
    body: {
      merchantId: this.config.merchantId,
      merchantSiteId: this.config.merchantSiteId,
      userTokenId: arryoption.userTokenId,
      clientRequestId: arryoption.clientRequestId,
      userPaymentOptionId: arryoption.userPaymentOptionId,
      timeStamp: TIMESTAMP,
      checksum: calculateChecksum(arrayParamToken)
    },
    json: true
  };

  const res = await
    doDeleteUPO(optionarray);

  return res;
};

function doDeleteUPO(optionarray) {
  return new Promise(function (resolve, reject) {

    request(optionarray, function (error, response, body) {

      if (error) {
        reject('Unable to connect to server');
      } else {
        resolve(body);
      }
    });
  });
}

//Get User UPOs
SafeCharge.prototype.getUserUPOs = async function getUserUPOs(arryoption) {

  //Param validation
  if (!this.config.merchantId || !this.config.merchantSiteId || !this.config.merchantSecretKey || !this.config.merchantHostURL ||
    !arryoption.userTokenId || !arryoption.clientRequestId) {
    throw new Error('Params are missing');
  }

  const TIMESTAMP = dt.format('YmdHMS').toString();

  //Create Array For CheckSum
  const arrayParamToken = [this.config.merchantId, this.config.merchantSiteId, arryoption.userTokenId, arryoption.clientRequestId, TIMESTAMP, this.config.merchantSecretKey];

  const optionarray = {
    method: 'POST',
    url: 'https://' + this.config.merchantHostURL + '/ppp/api/v1/getUserUPOs.do',
    headers: {
      'content-type': 'application/json'
    },
    body: {
      merchantId: this.config.merchantId,
      merchantSiteId: this.config.merchantSiteId,
      userTokenId: arryoption.userTokenId,
      clientRequestId: arryoption.clientRequestId,
      timeStamp: TIMESTAMP,
      checksum: calculateChecksum(arrayParamToken)
    },
    json: true
  };

  const res = await
    doGetUserUPOs(optionarray);

  return res;
};

function doGetUserUPOs(optionarray) {

  return new Promise(function (resolve, reject) {

    request(optionarray, function (error, response, body) {

      if (error) {
        reject('Unable to connect to server');
      } else {
        resolve(body);
      }
    });
  });
}


//Suspend UPO
SafeCharge.prototype.suspendUPO = async function suspendUPO(arryoption) {
  //object Validation

  //Param validation
  if (!this.config.merchantId || !this.config.merchantSiteId || !this.config.merchantSecretKey || !this.config.merchantHostURL ||
    !arryoption.userTokenId || !arryoption.clientRequestId || !arryoption.userPaymentOptionId) {
    throw new Error('Params are missing');
  }

  const TIMESTAMP = dt.format('YmdHMS').toString();

  //Create Array For CheckSum
  const arrayParamToken = [this.config.merchantId, this.config.merchantSiteId, arryoption.userTokenId, arryoption.clientRequestId, arryoption.userPaymentOptionId, TIMESTAMP, this.config.merchantSecretKey];

  const optionarray = {
    method: 'POST',
    url: 'https://' + this.config.merchantHostURL + '/ppp/api/v1/suspendUPO.do',
    headers: {
      'content-type': 'application/json'
    },
    body: {
      merchantId: this.config.merchantId,
      merchantSiteId: this.config.merchantSiteId,
      clientRequestId: arryoption.clientRequestId,
      userTokenId: arryoption.userTokenId,
      userPaymentOptionId: arryoption.userPaymentOptionId,
      timeStamp: TIMESTAMP,
      checksum: calculateChecksum(arrayParamToken)
    },
    json: true
  };

  const res = await
    doSuspendUPO(optionarray);

  return res;
};

function doSuspendUPO(optionarray) {
  return new Promise(function (resolve, reject) {

    request(optionarray, function (error, response, body) {

      if (error) {
        reject('Unable to connect to server');
      } else {
        resolve(body);
      }
    });
  });
}

//Enable UPOs
SafeCharge.prototype.enableUPO = async function enableUPO(arryoption) {

  //Param validation
  if (!this.config.merchantId || !this.config.merchantSiteId || !this.config.merchantSecretKey || !this.config.merchantHostURL ||
    !arryoption.userTokenId || !arryoption.clientRequestId || !arryoption.userPaymentOptionId) {
    throw new Error('Params are missing');
  }

  const TIMESTAMP = dt.format('YmdHMS').toString();

  //Create Array For CheckSum
  const arrayParamToken = [this.config.merchantId, this.config.merchantSiteId, arryoption.userTokenId, arryoption.clientRequestId, arryoption.userPaymentOptionId, TIMESTAMP, this.config.merchantSecretKey];

  // create json array for Token Request
  const optionarray = {
    method: 'POST',
    url: 'https://' + this.config.merchantHostURL + '/ppp/api/v1/enableUPO.do',
    headers: {
      'content-type': 'application/json'
    },
    body: {
      merchantId: this.config.merchantId,
      merchantSiteId: this.config.merchantSiteId,
      clientRequestId: arryoption.clientRequestId,
      userTokenId: arryoption.userTokenId,
      userPaymentOptionId: arryoption.userPaymentOptionId,
      timeStamp: TIMESTAMP,
      checksum: calculateChecksum(arrayParamToken)
    },
    json: true
  };

  const res = await
    doEnableUPO(optionarray);

  return res;
};

function doEnableUPO(optionarray) {

  return new Promise(function (resolve, reject) {

    request(optionarray, function (error, response, body) {

      if (error) {
        reject('Unable to connect to server');
      } else {
        resolve(body);
      }
    });
  });
}

///// Alternate Payment Method //////

//get APMs
SafeCharge.prototype.getAPMs = async function getAPMs(arrGetAPMs) {

  //Param validation
  if (!this.config.merchantId || !this.config.merchantSiteId || !this.config.merchantHostURL ||
    !arrGetAPMs.clientRequestId || !arrGetAPMs.sessionToken
  ) {
    throw new Error('Params are missing');
  }

  const TIMESTAMP = dt.format('YmdHMS').toString();

  // create array for calculate checksum
  const createAPMsCheckSumarray = [this.config.merchantId, this.config.merchantSiteId, arrGetAPMs.clientRequestId, TIMESTAMP, this.config.merchantSecretKey];

  //make array for Get APMS Params
  const optionGetAPMs = {
    method: 'POST',
    url: 'https://' + this.config.merchantHostURL + '/ppp/api/v1/getMerchantPaymentMethods.do',
    headers: {
      'content-type': 'application/json'
    },
    body: {
      sessionToken: arrGetAPMs.sessionToken,
      merchantId: this.config.merchantId,
      merchantSiteId: this.config.merchantSiteId,
      clientRequestId: arrGetAPMs.clientRequestId,
      countryCode: arrGetAPMs.localeDetail.countryCode,
      currencyCode: arrGetAPMs.localeDetail.currencyCode,
      languageCode: arrGetAPMs.localeDetail.languageCode,
      timeStamp: TIMESTAMP,
      checksum: calculateChecksum(createAPMsCheckSumarray)
    },
    json: true
  };

  const res = await
    doGetAPMs(optionGetAPMs);

  return res;
};

function doGetAPMs(optionarray) {
  return new Promise(function (resolve, reject) {

    request(optionarray, function (error, response, body) {

      if (error) {
        reject('Unable to connect to server');
      } else {
        resolve(body);
      }
    });
  });
}

///// Payout /////

//Payout
SafeCharge.prototype.payout = async function payout(arrPayout) {

  //Param validation
  if (!this.config.merchantId || !this.config.merchantSiteId || !this.config.merchantHostURL ||
    !arrPayout.clientRequestId || !this.config.merchantSecretKey || !arrPayout.amountDetails.currency ||
    !arrPayout.amountDetails.amount || !arrPayout.userTokenId
  ) {
    throw new Error('Params are missing');
  }

  const TIMESTAMP = dt.format('YmdHMS').toString();

  // create array for calculate checksum
  const createPayoutCheckSumarray = [this.config.merchantId, this.config.merchantSiteId, arrPayout.clientRequestId, arrPayout.amountDetails.amount, arrPayout.amountDetails.currency, TIMESTAMP, this.config.merchantSecretKey];

  ///make array for Payout Params
  const optionPayout = {
    method: 'POST',
    url: 'https://' + this.config.merchantHostURL + '/ppp/api/v1/payout.do',
    headers: {
      'content-type': 'application/json'
    },
    body: {
      sessionToken: arrPayout.sessionToken,
      merchantId: this.config.merchantId,
      merchantSiteId: this.config.merchantSiteId,
      clientRequestId: arrPayout.clientRequestId,
      userTokenId: arrPayout.userTokenId,
      amount: arrPayout.amountDetails.amount,
      currency: arrPayout.amountDetails.currency,
      timeStamp: TIMESTAMP,
      checksum: calculateChecksum(createPayoutCheckSumarray)
    },
    json: true
  };

  const res = await
    doPayout(optionPayout);

  return res;
};

function doPayout(optionarray) {

  return new Promise(function (resolve, reject) {

    request(optionarray, function (error, response, body) {

      if (error) {
        reject('Unable to connect to server');
      } else {
        resolve(body);
      }
    });
  });
}

///// Get Hosted Payment Page URL /////

//Hosted Payment Page URL
SafeCharge.prototype.getPaymentURL = async function getPaymentURL(arrGetPaymentUrl) {
  //Param validation
  if (!this.config.merchantId || !this.config.merchantSiteId || !this.config.merchantHostURL ||
    !this.config.merchantSecretKey || !arrGetPaymentUrl.currency ||
    !arrGetPaymentUrl.amount || !arrGetPaymentUrl.userId || !arrGetPaymentUrl.internalPaymentId || !arrGetPaymentUrl.billingAddress.country
  ) {
    throw new Error('Params are missing');
  }

  const TIMESTAMP = dt.format('YmdHMS').toString();
  const AMOUNT = Currency.fromSmallestSubunit(arrGetPaymentUrl.amount, arrGetPaymentUrl.currency);

  // create array for calculate checksum
  const createGetURLCheckSumarray = [this.config.merchantId, this.config.merchantSiteId, arrGetPaymentUrl.internalPaymentId, AMOUNT, arrGetPaymentUrl.currency, TIMESTAMP, this.config.merchantSecretKey];

  ///make array for Payment URL Params
  const optionPayout = {
    method: 'POST',
    url: 'https://' + this.config.merchantHostURL + '/ppp/api/v1/getPaymentPageUrl.do',
    headers: {
      'content-type': 'application/json'
    },
    body: {
      merchantId: this.config.merchantId,
      merchantSiteId: this.config.merchantSiteId,
      clientRequestId: arrGetPaymentUrl.internalPaymentId,
      userTokenId: arrGetPaymentUrl.userId,
      amount: AMOUNT,
      currency: arrGetPaymentUrl.currency,
      amountDetails: {
        totalShipping: 0,
        totalHandling: 0,
        totalDiscount: 0,
        totalTax: 0
      },
      items: [{
        name: arrGetPaymentUrl.reference,
        price: AMOUNT,
        quantity: 1
      }],
      billingAddress: { //user billing address
        firstName: arrGetPaymentUrl.billingAddress.firstName,
        lastName: arrGetPaymentUrl.billingAddress.lastName,
        country: arrGetPaymentUrl.billingAddress.country,
        email: arrGetPaymentUrl.billingAddress.email
      },
      urlDetails: {
        successUrl: arrGetPaymentUrl.urlDetails.successUrl,
        failureUrl: arrGetPaymentUrl.urlDetails.failureUrl,
        pendingUrl: arrGetPaymentUrl.urlDetails.pendingUrl,
        notificationUrl: arrGetPaymentUrl.urlDetails.notificationUrl,
        backUrl: arrGetPaymentUrl.urlDetails.backUrl
      },
      merchantDetails: {
        customField1: arrGetPaymentUrl.internalPaymentId
      },
      userToken: 'auto',
      isNative: '1',
      merchantLocale: 'en_US',
      themeId: arrGetPaymentUrl.themeId,
      timeStamp: TIMESTAMP,
      checksum: calculateChecksum(createGetURLCheckSumarray)
    },
    json: true
  };

  //console.log( "CHECKSUM ", optionPayout.body.checksum );
  //console.log( "REQUEST : ", optionPayout );

  const res = await
    dogetPaymentURL(optionPayout);

  return res;
};

function dogetPaymentURL(optionarray) {

  return new Promise(function (resolve, reject) {
    request(optionarray, function (error, response, body) {

      if (error) {
        reject('Unable to connect to server');
      } else {
        paymentPageResponse = {
          redirectUrl: body.paymentPageUrl,
          raw: body,
          reason: body.reason
        };
        resolve(paymentPageResponse);
      }
    });
  });
}

///// Validate DMN (Direct Merchant Notifications) /////

SafeCharge.prototype.validateDMNCallback = function validateDMNCallback(callbackRequestBody) {
  callbackRequestBody.merchantSecretKey = this.config.merchantSecretKey;

  const res = doValidateDMNCallback(callbackRequestBody);
  return res;
};

function doValidateDMNCallback(callbackRequestBody) {
  const paymentCallBackCheckSum = [callbackRequestBody.merchantSecretKey, callbackRequestBody.totalAmount, callbackRequestBody.currency, callbackRequestBody.responseTimeStamp, callbackRequestBody.PPP_TransactionID, callbackRequestBody.Status, callbackRequestBody.productId];
  const checksumToValidate = calculateChecksum(paymentCallBackCheckSum);

  if(checksumToValidate === callbackRequestBody.advanceResponseChecksum)
  {
    return true;
  }
  return false;
}

///// Parse DMN (Direct Merchant Notifications) Response /////

SafeCharge.prototype.parseCallbackResponse = function parseCallbackResponse(callbackResponse) {

  let SafeChargePayment;
  if(callbackResponse)
  {
    SafeChargePayment = {
      internalPaymentId: callbackResponse.customField1,
      externalId: callbackResponse.TransactionID,
      amount: Currency.toSmallestSubunit(callbackResponse.totalAmount, callbackResponse.currency),
      currency: callbackResponse.currency,
      state: convertPaymentState(callbackResponse.Status),
      eci: callbackResponse.eci,
      authCode: callbackResponse.AuthCode,
      card: {
        token: callbackResponse.Token,
        bin: callbackResponse.bin,
        lastFour: callbackResponse.cardNumber.slice(-4),
        cardBrand: callbackResponse.cardCompany.toUpperCase(),
        expiryDate: callbackResponse.expMonth+callbackResponse.expYear
      },
      raw: callbackResponse
    };
  }
  const res = doParseCallbackResponse(SafeChargePayment);
  return res;
};

function doParseCallbackResponse(callbackResponse) {
  if(callbackResponse)
  {
    return callbackResponse;
  }
  throw new Error('Callback response is empty');
}

const STATE_PENDING = 'pending',
  STATE_DECLINED = 'declined',
  STATE_FAILED = 'failed',
  STATE_AUTHORIZED = 'completed',
  STATE_CAPTURED = 'captured',
  STATE_CANCELLED = 'cancelled';

/**
 * Converts a state string from an SafeCharge payment object to one of the allowed states of a payment:
 *   pending, declined, failed, cancelled, authorized
 *
 * @param {string} state
 * @returns {string|null}
 * @private
 */
function convertPaymentState(state) {
  // First decide from original state
  switch (state.toLowerCase()) {
    case 'pending':
      return STATE_PENDING;
    case 'failed':
    case 'error':
      return STATE_FAILED;
    case 'expired':
    case 'cancelled':
      return STATE_CANCELLED;
    case 'approved':
      return STATE_AUTHORIZED;
    case 'declined':
      return STATE_DECLINED;
    default:
      throw new Error(`Payment state unknown: ${state}`);
  }
}

module.exports = SafeCharge;
