import * as React from 'react';
import './App.css';
import axios from 'axios';

declare var Coinify: any;

class App extends React.Component {
  state = {
    cardData: {
      cardNumber:"4012001037490014",
      cardHolderName:"John Doe",
      expirationMonth:"01",
      expirationYear:"2020",
      CVV:"123"
    },
    cardList: [],
    choosenCard: null,
    payment: {
      cardId: null,
      state: '',
      clientUniqueId: '',
      clientRequestId: '',
      acsUrl: '',
      CVV2Reply: '',
      externalTransactionId: '',
      internalRequestId: '',
      paRequest: '',
      sessionToken: '',
      transactionId: '',
      userTokenId: '',
      orderId: ''
    }
  }
  public lastPARequest: string;
  public lastAscUrl: string;
  public componentDidMount() {
    const script = document.createElement("script");
    //script.src = "https://cdn.safecharge.com/js/v1/safecharge.js";
    script.src = "http://localhost:9615/coinify.js";
    script.async = true;
    document.body.appendChild(script);
  }
  public onSubmitSaveCardForm( e: any ) {
    this.clearCardList();
    axios.get('http://localhost:8087/cards/storeCardPayload').then( response => {
      const payload = response.data.payload;
      const psp = response.data.psp;
      payload.cardData = this.state.cardData;
      Coinify.createTemporaryCardToken( payload, psp ).then( (ret: any) => {
        if ( ret && ret.status === "SUCCESS" ) {
          console.log( "response ", ret );
          this.saveCardByTempToken( ret.ccTempToken, payload.sessionToken,
            /*ret.userTokenId, ret.clientRequestId,*/ ( saveCardRet: any ) => {
            console.log( "Save card ret ", saveCardRet );
          } );
        } else {
          console.error("FAILED", ret);
        }
      } );
    } );
    e.preventDefault();
    e.stopPropagation();
  }

  public saveCardByTempToken( ccTempToken: string, session: string, /*userTokenId: string, clientRequestId: string,*/ cb: any ) {
    const args = {
      ccTempToken: ccTempToken,
      sessionToken: session
    };
    axios.post('http://localhost:8087/cards', args).then( response => {
      console.log( "saveCardByTempToken RESP ", response.data );
    } );
  }

  public getSavedCards( cb: any ) {
    axios.get('https://localhost:8087/cards').then( response => {
      console.log( "get cards RESPONSE ", response.data );
      cb( response.data );
    } );
  } 

  public deleteCard( cardId: any, cb: any ) {
    axios.delete('http://localhost:8087/cards', { params: { cardId: cardId } } ).then( response => {
      console.log( "get cards RESPONSE ", response.data );

      // reset the card list...
      this.clearCardList();

      cb( response.data );
    } );
  } 

  clearCardList() {
    this.state.cardList = [];
    this.setState( this.state );
  }

  public onGetSavedCards() {
    this.getSavedCards( (result: any ) => {
      console.log( "Get card result ", result );

      if ( result.cards && result.cards.paymentMethods && result.cards.paymentMethods.length > 0 ) {
        this.state.cardList = result.cards.paymentMethods.map( (x: any) => {
          return {
            id: x.userPaymentOptionId,
            bin: x.upoData.bin,
            upoName: x.upoName,
            upoStatus: x.upoStatus
          };
        } );
        if ( !this.state.choosenCard && this.state.cardList.length > 0 ) {
          this.state.choosenCard = (this.state.cardList[0] as any).id;
        }
        this.setState( this.state );
      }
    } );
  }

  onCreateTradeAndPayWithCard(e: any){
    e.preventDefault();
    e.stopPropagation();

    if ( !this.state.choosenCard ) {
      console.error("No card choosen");
      return;
    }

    this.state.payment.state = 'auth3ds';
    this.state.payment.cardId = this.state.choosenCard;

    const postBody = {
      priceQuoteId: 36762,
      transferIn: {
        medium: "card",
        details: {
          returnUrl: "https://app.sandbox.coinify.com/",
          cardId: this.state.choosenCard
        }
      },
      transferOut: {
        medium: "blockchain",
        details: {
          account: "mnX9kQWKthDViink1UHYCaxPn8sj5FNVea"
        }
      },
    };

    console.log( "create trade with payment method" + this.state.choosenCard );
    Coinify.showLoadingOverlay(true);
    axios.post( 'http://localhost:8087/trades', postBody ).then( response => {
      Coinify.showLoadingOverlay(false);
      if ( !response.data.transferIn ) {
        console.error( "Error no TX in");
        return;
      }
      const details = response.data.transferIn.details || {};
      const _status = details.status;
      if ( _status !== 'SUCCESS' ) {
        console.error( "Error doing 3DS step of payment ", response.data );
        return;
      }

      // console.log( "details ", details );
      this.state.payment.clientUniqueId = details.clientUniqueId;
      this.state.payment.clientRequestId = details.clientRequestId;
      this.state.payment.acsUrl = details.acsUrl;
      this.state.payment.CVV2Reply = details.CVV2Reply;
      this.state.payment.externalTransactionId = details.externalTransactionId;
      this.state.payment.internalRequestId = details.internalRequestId;
      this.state.payment.paRequest = details.paRequest;
      this.state.payment.sessionToken = details.sessionToken;
      this.state.payment.transactionId = details.transactionId;
      this.state.payment.userTokenId = details.userTokenId;
      console.log( "Got payment orderId ", details.orderId );
      this.state.payment.orderId = details.orderId;

      const urlData = {
        url: this.state.payment.acsUrl,
        PaReq: this.state.payment.paRequest,
        is3DS: true,
        callbackUrl: 'https://immense-hamlet-63274.herokuapp.com/?pares'
      };

      Coinify.openPaymentUrl( urlData, undefined, 'safecharge' ).then( (PaRes: any) => {
        if ( !PaRes ) {
          console.error( "Failed to retrieve 3DS response." );
          this.state.payment.state = 'error-auth3ds';
        } else {
          console.log( "Finalize trade - finalizePayment" );
          this.state.payment.state = 'paying';
          this.finalizePayment( PaRes ).then( (finalizePayResp: any) => {
            //console.log( "finalizePayment Response ", finalizePayResp );
            console.error( "Payment Result: ", finalizePayResp.status, " : ", finalizePayResp.reason );
            this.state.payment.state = 'done';
          } );
        }
      } );
    } ).catch( (err: any)=> {
      Coinify.showLoadingOverlay(false);
      console.error( "Error creating trade");
      this.state.payment.state = 'error-auth3ds';
    } );
  }

  finalizePayment( PaRes: any ) {
    if ( !PaRes ) {
      throw new Error( "Invalid PA Res" );
    }
    return new Promise( ( cb, reject ) => {
      const pay = this.state.payment;
      const postBody = {
        PaRes: PaRes,
        sessionToken: pay.sessionToken,
        userTokenId: pay.userTokenId,
        clientRequestId: pay.clientRequestId,
        upoId: pay.cardId,
        clientUniqueId: pay.clientUniqueId,
        orderId: pay.orderId,
      };
      //console.log( "Finalize payment" );
      axios.post( 'http://localhost:8087/cards/finalizePayment', postBody ).then( response => {
        //console.log( "Finalize payment Response ", response );
        cb(response.data);
      } );
    } );
  }

  getCardList(): string[] {
    return this.state.cardList;
  }

  getPARequest() {
    return this.lastPARequest || "eJxVUdtuwjAM/ZWK95Gk3ErlRioDbWgqQ1sleI2CtXbQC0m6wb5+SVcuixTJ59g+to4hzRTi/B1lo5BDglqLD/TyXdSrxQMbMT8Y+8GI9Tis4zc8cvhCpfOq5KxP+z6QC7StSmaiNByEPM6WKz5kbEoDIB2EAtVyzundm7ARkD8aSlEgj5WsjJeiNt5FDkibAVk1pVFnHgwpkAuARh14ZkwdEnKopDhklbYdjgVyW2jduEhblVO+48k8/r79BUvS5XD1aX+6iIC4CtgJg9ynLKBjFng+Df1JOJgCaXkQhRvPGaV9apfpINRuSnzNudQ9BdZhhaU88+nEunJFgKe6KtFWWDevMZDb0o/PzlNprE1P241+2W+yH7nfqgFbNcUseY2jyLncFji13DrjU8paOQeAOAnSHZB0R7bRv+P/Ag==";
  }

  getAscUrl() {
    return this.lastAscUrl || "https://pit.3dsecure.net/VbVTestSuiteService/pit1/acsService/paReq?summary=NGIxZWUxNDctMDAyYS00NDM0LTg1YmQtYzEyNTE1N2RhOTZl";
  }

  getTestPay() {
    return "https://ppp-test.safecharge.com/ppp/purchase.do?merchant_site_id=140263&merchant_id=7583429810138495724&time_stamp=2018-05-06 10:13:31&total_amount=10&currency=USD&checksum=2212a3bfc23e00b6a2a238dfa25513ebfb2425a3e3d1edc5725b81bd1e93d40f&item_name_1=Cashier Test product&item_amount_1=10&item_quantity_1=1&user_token=auto&version=3.0.0&user_token_id=Test_&item_open_amount_1=true&item_min_amount_1=1&item_max_amount_1=1000&first_name=Arslan&last_name=Pervaiz&email=test@test.com&address1=test&city=test&country=NL&zip=123456&phone1=123456&payment_method=cc_card&userid=test1234&success_url=http://localhost:8087/callback.html?success&back_url=http://localhost:8087/callback.html?return/safecharge&error_url=http://localhost:8087/callback.html?rejected";
  }

  onOpenHostedPaymentPage(){
    Coinify.openPaymentUrl( { url: this.getTestPay(), is3DS: false, callbackUrl: 'www.google.com' }, undefined, 'safecharge' );
  }

  onDeleteSelectedCard() {
    this.deleteCard( this.state.choosenCard, ( response: any ) => {
      console.log( "Delete calblack ; ", response );
    } );
  }

  public render() {
    const self = this;
    return (
      <div className="App">
        <header className="App-header">test</header>
        <p className="App-intro">-</p>


        <div>
          <label>register card</label>
          <form onSubmit={ (event) => { this.onSubmitSaveCardForm(event); } } >
            <label>name</label><input defaultValue={self.state.cardData.cardHolderName} onChange={ e => {self.state.cardData.cardHolderName = e.target.value;} } /><br/>
            <label>card</label><input defaultValue={self.state.cardData.cardNumber} onChange={ e => {self.state.cardData.cardNumber = e.target.value;} } /><br/>
            <label>exp. month</label><input defaultValue={self.state.cardData.expirationMonth} onChange={ e => {self.state.cardData.expirationMonth = e.target.value;} } /><br/>
            <label>exp. year</label><input defaultValue={self.state.cardData.expirationYear} onChange={ e => {self.state.cardData.expirationYear = e.target.value;} } /><br/>
            <label>cvv</label><input defaultValue={self.state.cardData.CVV} onChange={ e => {self.state.cardData.CVV = e.target.value;} } /><br/>
            <button type="submit">create</button>
          </form> 

          <br/>
          <label>Get saved cards</label>
          <button onClick={() => { this.onGetSavedCards(); } }>get saved cards</button>
          <br/>

          <label>pay for order with given upo</label>
          <form onSubmit={ (event) => { this.onCreateTradeAndPayWithCard(event); } }  >
            <label>Cards</label>{/*<input defaultValue={self.state.pay.upo} onChange={ e => {self.state.pay.upo = e.target.value;} } /><br/> */}
            <select onChange={ (e: any) => {console.log(e.target);self.state.choosenCard = e.target.value;} }>
              {self.getCardList().map( (x: any) => { return (<option key={x.id}>{x.upoName}</option>); }) }
            </select>;
            <button type="submit">create trade and pay with selected card</button>
          </form>
          <br/>
          <button onClick={()=>{self.onDeleteSelectedCard();}}>del selected card</button>

          <br/>
          <br/>
          <button onClick={()=>{self.onOpenHostedPaymentPage();}}>test open payment url with hosted payment page</button>
        </div>


        <br/>

      </div>
    );
  }
}

export default App;
