console.log("*** Coinify library ***");
(function() {
  window.Coinify = {
    loaded: false,
    loading: false,
    overlay: undefined,
    registerCard: undefined,
    initPSP: undefined,
    PSPType: {
      safecharge: 'safecharge'
    }
  };

  // Constants.
  window.Coinify.Register = {
    Permanently: 1,
    ForTemporaryUse: 2
  };

  window.Coinify.callbackUrl3DS = "localhost:6564";
  window.Coinify.callbackUrlPayment = "localhost:1234";

  window.Coinify.getRequest = ( url, error ) => {
    return new Promise( (callback, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('GET', url);
      xhr.withCredentials = true;
      xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
      xhr.setRequestHeader('Content-Type', 'application/json');
      xhr.onreadystatechange = () => {
        if ( xhr.readyState === 4 ) {
          if ( xhr.status === 200 || ( xhr.status === 0 && xhr.responseText !== '' ) ) {
            callback({
              url: url,
              status: 200,
              body: xhr.responseText || ''
            });
          }
          else {
            error({
              url: url,
              status: xhr.status,
              body: xhr.responseText || ''
            });
          }
        }
      };
      xhr.send();
    } );
  };

  window.Coinify.applyCardData = ( payload, pspType, cardData ) => {
    if ( pspType !== Coinify.PSPType.safecharge ) {
      throw new Error( 'Invalid psp: ' + pspType );
    }
    payload = Object.assign({},payload || {});
    payload.cardData = cardData;
    return payload;
  };

  window.Coinify.createOverlay = () => {
    if ( window.Coinify.overlay ) {
      return window.Coinify.overlay;
    }
    console.log( "Creating overlay" );
    const o = window.Coinify.overlay = document.createElement( 'div' );
    o.className = "c-overlay c-is-hidden";
    o.id = "c-overlay";
    const body = document.getElementsByTagName('body')[0];

    body.appendChild( o );
    const css = `
      .c-is-hidden {
        display: none;
      }
      .c-button-close {
        display: inline-block;
        width: 16px;
        height: 16px;
        position: absolute;
        top: 10px;
        right: 10px;
        cursor: pointer;
        background-image: url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAAowAAAKMB8MeazgAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAAB5SURBVDiNrZPRCcAwCEQfnUiySAZuF8kSWeH6Yz8KrQZMQAicJ+epAB0YwAmYJKIADLic0/GPPCbQAnLznCd/4NWUFfkgy1VjH8CryA95ApYltAiTRCZxpuoW+gz9WXE6NPeg+ra1UDIxGlWEObe4SGxY5fIxlc75Bkt9V4JS7KWJAAAAAElFTkSuQmCC59ef34356faa7edebc7ed5432ddb673d');
      }
      .c-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.6);
      }
      .c-modal-content {
        padding: 20px 30px;
        width: 600px;
        position: relative;
        min-height: 300px;
        margin: 5% auto 0;
        background: #fff;
      }
      .c-stretch {
        width: 100%;
        height: 100%;
      }
    `;
    const style = document.createElement('style');
    style.type = 'text/css';
    if ( style.styleSheet ) {
      style.styleSheet.cssText = css;
    } else {
      style.appendChild( document.createTextNode(css) );
    }
    const head = document.head || document.getElementsByTagName('head')[0];
    (head || body).appendChild(style);
    return o;
  };

  window.Coinify.create3DSFrame = ( url, PARequest, iframeCallbackUrl ) => {
    let o = window.Coinify.container3ds;
    if ( !o ) {
      o = window.Coinify.container3ds = document.createElement( 'div' );
      const body = document.getElementsByTagName('body')[0];
      const form = window.Coinify.container3dsForm = document.createElement( 'form' );
      const i1 = window.Coinify.container3dsi1 = document.createElement( 'form' );
      const i2 = window.Coinify.container3dsi2 = document.createElement( 'form' );
      const _iframe = window.Coinify.container3dsFrame = document.createElement( 'iframe' );

      o.className = "c-stretch";
      form.setAttribute("target", "coinify-3dsframe");
      form.setAttribute("id", "redirect-3ds");
      form.setAttribute("method", "post");
      _iframe.setAttribute("name", "coinify-3dsframe");
      _iframe.className = "c-stretch";
      i1.setAttribute("type", "hidden");
      i1.setAttribute("name", "PaReq");
      i2.setAttribute("type", "hidden");
      i2.setAttribute("name", "TermUrl");

      form.appendChild( i1 );
      form.appendChild( i2 );
      o.appendChild( form );
      o.appendChild( _iframe );
      body.appendChild( o );
    }
    window.Coinify.container3dsForm.setAttribute("action", url);
    window.Coinify.container3dsi1.setAttribute("value", PARequest);
    window.Coinify.container3dsi2.setAttribute("value", iframeCallbackUrl );
    console.log("submit");
    setTimeout( () => {
      window.Coinify.container3dsForm.submit();
    } );
    return o;
  }

  window.Coinify.createPaymentFrame = ( url ) => {
    let o = window.Coinify.containerPay;
    if ( !o ) {
      o = window.Coinify.containerPay = document.createElement( 'div' );
      o.className = "c-stretch";
      const body = document.getElementsByTagName('body')[0];
      const _iframe = document.createElement( 'iframe' );
      _iframe.setAttribute("id", "redirect-pay");
      _iframe.setAttribute("name", "coinify-paymentframe");
      _iframe.className = "c-stretch";
      _iframe.src = url;
      o.appendChild( _iframe );
      body.appendChild( o );
    }
    return o;
  }

  window.Coinify.showOverlay = ( value, container ) => {
    const overlay = window.Coinify.overlay;
    if ( value || value === undefined ) {
      overlay.classList.remove("c-is-hidden");
      if ( container ) {
        container.appendChild( overlay );
      }
    } else {
      overlay.classList.add("c-is-hidden");
    }
  };

  window.Coinify.initPSP = ( pspType ) => {
    if ( pspType !== Coinify.PSPType.safecharge ) {
      throw new Error( 'Invalid psp :' + pspType );
    }
    if ( window.Coinify.loading ) {
      throw new Error( "Already loading" );
    }
    return new Promise( (cb, reject) => {

      if ( window.Coinify.loaded ) {
        cb( window.Safecharge );
        return;
      }

      // Bootstrap SafeCharge and then execute the create token request,
      var self = window.Coinify;
      self.loaded = false;
      self.loading = true;
      var _script = document.createElement( 'script' );
      _script.type = 'text/javascript';
      _script.src = 'https://cdn.safecharge.com/js/v1/safecharge.js';
      _script.onload = () => {
        self.loaded = !!window.Safecharge;
        self.loading = false;
        if ( !self.loaded ) {
          throw new Error( 'Failed to load Safecharge library' );
        }
        cb( window.Safecharge );
      };
      const body = document.getElementsByTagName('body')[0];
      body.appendChild(_script);
    } );
  };

  /**
   * Invoke the registerCard with some info like the following.
   */
  window.Coinify.createTemporaryCardToken = ( cardInfo, pspType ) => {
    if ( pspType !== Coinify.PSPType.safecharge ) {
      throw new Error( 'Invalid psp :' + pspType );
    }
    return new Promise( (cb, reject) => {
      window.Coinify.initPSP( pspType ).then( ( psp ) => {
        psp.card.createToken( cardInfo, ( e ) => {
          cb( e );
        } );
      } );
    });
  };

  /**
   * Loads the payment URL inside a container.
   */ 
  window.Coinify.openPaymentUrl = ( urlData, container, pspType ) => {
    if ( !pspType ) {
      throw new Error( 'Invalid psp: ' + pspType );
    }
    if ( !container ) {
      container = Coinify.createOverlay();
      Coinify.showOverlay();
    }
    return new Promise( (cb, reject) => {
      let frame;
      if ( urlData.is3DS ) {
        const callbackUrl = urlData.callbackUrl || window.Coinify.callbackUrl3DS;
        frame = window.Coinify.create3DSFrame( urlData.url, urlData.PaReq, callbackUrl );
      } else {
        const callbackUrl = urlData.callbackUrl || window.Coinify.callbackUrlPayment;
        frame = window.Coinify.createPaymentFrame( urlData.url );
      }
      container.appendChild(frame);
    });
  };

})();



