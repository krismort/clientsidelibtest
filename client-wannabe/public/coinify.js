(function() {
  window.Coinify = {
    loaded: false,
    loading: false,
    registerPaymentCard: undefined,
    loadSafeCharge: undefined,
  };

  window.Coinify.loadSafeCharge = function( cb ) {
    if ( window.Coinify.loading ) {
      throw new Error( "Already loading" );
    }

    if ( window.Coinify.loaded ) {
      cb( window.Safecharge );
      return;
    }

    // Bootstrap SafeCharge and then execute the create token request,
    var self = window.Coinify;
    self.loaded = false;
    self.loading = true;
    var _script = document.createElement("script");
    _script.type = "text/javascript";
    _script.src = "https://cdn.safecharge.com/js/v1/safecharge.js";
    _script.onload = function() {
      self.loaded = !!window.Safecharge;
      self.loading = false;
      if ( !self.loaded ) {
        throw new Error( "Failed to load Safecharge library" );
      }
      cb( window.Safecharge );
    };
    document.getElementsByTagName("head")[0].appendChild(_script);
  } 

  window.Coinify.getRegisterPaymentCardSession = function( cardInfo ) {
    // Our service->session
  };

  /**
   * Invoke the registerPaymentCard with some info like the following.
   */
  /* const cardInfoExample = {
    "merchantSiteId": "1811",
    "environment": "test",
    "sessionToken": "3b2259be-192a-4ca9-832d-01d6a8a26577",
    "billingAddress": {
      "city": null,
      "country": null,
      "zip": null,
      "email": null,
      "firstName": null,
      "lastName": null,
      "state": null
    },
    "cardData": {
      "cardNumber": "4394342465424311",
      "cardHolderName": "John Doe",
      "expirationMonth": "01",
      "expirationYear": "2020",
      "CVV": "123"
    }
  }; */
  window.Coinify.registerPaymentCard = function( cardInfo ) {
    window.Coinify.loadSafeCharge( function( safeCharge ) {
      safeCharge.createToken( cardInfo, function( e ) {
        console.log( "e ", e );
      } );
    } );
  };


})();
