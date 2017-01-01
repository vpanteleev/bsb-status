
var fs = require('fs');
var readline = require('readline');
var google = require('googleapis');
var googleAuth = require('google-auth-library');
var moment = require('moment');
var oxr = require('open-exchange-rates');
var fx = require('money');
var babar = require('babar');

let rates = {
    base: 'USD',
    rates: {
        AED: 3.672895,
        AFN: 65.7705,
        ALL: 128.331769,
        AMD: 483.737501,
        ANG: 1.776225,
        AOA: 165.9025,
        ARS: 15.868,
        AUD: 1.3873,
        AWG: 1.80025,
        AZN: 1.8017,
        BAM: 1.85842,
        BBD: 2.011799,
        BDT: 79.312949,
        BGN: 1.85733,
        BHD: 0.37657,
        BIF: 1681,
        BMD: 1,
        BND: 1.444732,
        BOB: 6.933441,
        BRL: 3.2552,
        BSD: 1.003438,
        BTC: 0.001024285817,
        BTN: 67.993833,
        BWP: 10.71985,
        BYN: 1.965632,
        BYR: 20026.25,
        BZD: 2.016811,
        CAD: 1.343851,
        CDF: 1169.950739,
        CHF: 1.0197,
        CLF: 0.025167,
        CLP: 669.1,
        CNY: 6.9447,
        COP: 3002,
        CRC: 552.813073,
        CUC: 1,
        CUP: 24.728383,
        CVE: 104.2835,
        CZK: 25.68255,
        DJF: 178.58,
        DKK: 7.0666,
        DOP: 46.697904,
        DZD: 110.397,
        EEK: 14.8736,
        EGP: 18.127,
        ERN: 15.14,
        ETB: 22.474959,
        EUR: 0.950705,
        FJD: 2.1053,
        FKP: 0.810435,
        GBP: 0.810435,
        GEL: 2.65392,
        GGP: 0.810435,
        GHS: 4.27,
        GIP: 0.810435,
        GMD: 42.7,
        GNF: 9456.95,
        GTQ: 7.517347,
        GYD: 207.861001,
        HKD: 7.75455,
        HNL: 23.358379,
        HRK: 7.1753,
        HTG: 67.222095,
        HUF: 294.28,
        IDR: 13487.716667,
        ILS: 3.85177,
        IMP: 0.810435,
        INR: 67.9669,
        IQD: 1188.075723,
        IRR: 30073.9923,
        ISK: 112.931448,
        JEP: 0.810435,
        JMD: 129.298155,
        JOD: 0.708099,
        JPY: 116.9245,
        KES: 102.441662,
        KGS: 69.217551,
        KHR: 4057.7,
        KMF: 465.766669,
        KPW: 899.91,
        KRW: 1207.26,
        KWD: 0.305365,
        KYD: 0.836194,
        KZT: 334.925938,
        LAK: 8213.25,
        LBP: 1514.872059,
        LKR: 150.319664,
        LRD: 92.994573,
        LSL: 13.748362,
        LTL: 3.28221,
        LVL: 0.668087,
        LYD: 1.4464,
        MAD: 10.118735,
        MDL: 19.937634,
        MGA: 3372.302299,
        MKD: 58.46028,
        MMK: 1370.1,
        MNT: 2484.166667,
        MOP: 8.014704,
        MRO: 359.926814,
        MTL: 0.683738,
        MUR: 36,
        MVR: 15.399668,
        MWK: 721.430535,
        MXN: 20.73516,
        MYR: 4.486016,
        MZN: 71.34,
        NAD: 13.748362,
        NGN: 305.800759,
        NIO: 29.561432,
        NOK: 8.6449,
        NPR: 108.905844,
        NZD: 1.443627,
        OMR: 0.384835,
        PAB: 1.003418,
        PEN: 3.35285,
        PGK: 3.187192,
        PHP: 49.590878,
        PKR: 104.732275,
        PLN: 4.186728,
        PYG: 5763.35,
        QAR: 3.6413,
        RON: 4.313794,
        RSD: 117.170863,
        RUB: 61.2663,
        RWF: 836.345,
        SAR: 3.75055,
        SBD: 7.939506,
        SCR: 13.448571,
        SDG: 6.517064,
        SEK: 9.107345,
        SGD: 1.447304,
        SHP: 0.810435,
        SLL: 5490,
        SOS: 580.41407,
        SRD: 7.4145,
        STD: 23292.25,
        SVC: 8.780056,
        SYP: 213.3,
        SZL: 13.746232,
        THB: 35.814,
        TJS: 7.896613,
        TMT: 3.499972,
        TND: 2.30149,
        TOP: 2.30715,
        TRY: 3.525985,
        TTD: 6.74272,
        TWD: 32.4255,
        TZS: 2178.65,
        UAH: 27.191873,
        UGX: 3617.25,
        USD: 1,
        UYU: 29.325395,
        UZS: 3215.85,
        VEF: 9.995005,
        VND: 22792.5,
        VUV: 110.246666,
        WST: 2.587833,
        XAF: 623.298059,
        XAG: 0.06281429,
        XAU: 0.00086778,
        XCD: 2.70255,
        XDR: 0.743864,
        XOF: 624.866317,
        XPD: 0.00146768,
        XPF: 114.287058,
        XPT: 0.00110809,
        YER: 250.225,
        ZAR: 13.73724,
        ZMK: 5252.024745,
        ZMW: 9.834678,
        ZWL: 322.387247
    },
}

oxr.set({ app_id: '00a00828253e4b67841fc0161fde095d' })

// If modifying these scopes, delete your previously saved credentials
// at ~/.credentials/gmail-nodejs-quickstart.json
var SCOPES = ['https://www.googleapis.com/auth/gmail.readonly'];
var TOKEN_DIR = (process.env.HOME || process.env.HOMEPATH ||
    process.env.USERPROFILE) + '/.credentials/';
var TOKEN_PATH = TOKEN_DIR + 'gmail-nodejs-quickstart.json';

// Load client secrets from a local file.
fs.readFile('client_secret.json', function processClientSecrets(err, content) {
  if (err) {
    console.log('Error loading client secret file: ' + err);
    return;
  }
  // Authorize a client with the loaded credentials, then call the
  // Gmail API.
  authorize(JSON.parse(content), listLabels);
});

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 *
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize(credentials, callback) {
  var clientSecret = credentials.installed.client_secret;
  var clientId = credentials.installed.client_id;
  var redirectUrl = credentials.installed.redirect_uris[0];
  var auth = new googleAuth();
  var oauth2Client = new auth.OAuth2(clientId, clientSecret, redirectUrl);

  // Check if we have previously stored a token.
  fs.readFile(TOKEN_PATH, function(err, token) {
    if (err) {
      getNewToken(oauth2Client, callback);
    } else {
      oauth2Client.credentials = JSON.parse(token);
      callback(oauth2Client);
    }
  });
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 *
 * @param {google.auth.OAuth2} oauth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback to call with the authorized
 *     client.
 */
function getNewToken(oauth2Client, callback) {
  var authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES
  });
  console.log('Authorize this app by visiting this url: ', authUrl);
  var rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  rl.question('Enter the code from that page here: ', function(code) {
    rl.close();
    oauth2Client.getToken(code, function(err, token) {
      if (err) {
        console.log('Error while trying to retrieve access token', err);
        return;
      }
      oauth2Client.credentials = token;
      storeToken(token);
      callback(oauth2Client);
    });
  });
}

/**
 * Store token to disk be used in later program executions.
 *
 * @param {Object} token The token to store to disk.
 */
function storeToken(token) {
  try {
    fs.mkdirSync(TOKEN_DIR);
  } catch (err) {
    if (err.code != 'EEXIST') {
      throw err;
    }
  }
  fs.writeFile(TOKEN_PATH, JSON.stringify(token));
  console.log('Token stored to ' + TOKEN_PATH);
}

/**
 * Lists the labels in the user's account.
 *
 * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
 */
function listLabels(auth) {
  let gmail = google.gmail('v1');
  let messages;
  gmail.users.messages.list({
    auth: auth,
    userId: 'me',
    q: 'bsb-bank card transaction after:2016/12/01 before:2017/01/01',
  }, function(err, response) {
    if (err) {
      console.log('The API returned an error: ' + err);
      return;
    }
    messagePromises = response.messages.map(message => new Promise((resolve, reject) => {
        gmail.users.messages.get({
          auth: auth,
          userId: 'me',
          id: message.id
        }, function(err, response) {
          if (err) {
            reject('The API returned an error: ' + err);
          }

          resolve(response);
      })
  }));

    return getCurrencyExchangeRates().then((rates) => {
        fx.rates = oxr.rates;
        fx.base = oxr.base;
    }).catch(err => {
        fx.rates = rates.rates;
        fx.base = rates.base;
    }).then(() => {
        return Promise.all(messagePromises).then(res => {
            let data = res.map(message => message.snippet).map((body) => {
                let arr = body.split(/Summa:|Ostatok:/);
                let date = moment((arr[0].split(/Uspeshno/)[1] || '').trim()).toDate();
                let value = parseFloat((arr[1] || '').trim().slice(0, -4));
                let currency = (arr[1] || '').trim().slice(-3);
                let place = (arr[2].split(/BYN/)[1] || '').trim();
                return {date, value, currency, place};
            }).filter((rawData) => rawData.date && rawData.value && rawData.place)
            .map((rawData) => {
                let data = Object.assign({}, rawData);
                if (data.currency !== 'BYN') {
                    data.value = fx(data.value).from(data.currency).to('BYN');
                    data.currency = 'BYN';
                }

                return data;
            });
            let places = [];

            data.forEach((rawData) => {
                if(!places.includes(rawData.place)) {
                    places.push(rawData.place);
                }
            });

            let result = places.map((place) => {
                return {place, value: getSum(data, place)};
            }).sort((a, b) => (b.value - a.value));

            let bars = result.map((bar, index) => [index, bar.value]);
            let placesView = result.map((bar, index) => [index, bar.place, Math.round(bar.value)]);
            console.log(babar(bars, {
              color: 'green',
              width: 160,
              height: 20,
              yFractions: 1
            }));
            console.log(placesView);
        });
    });
});
}

function getCurrencyExchangeRates(){
    return new Promise((resolve, reject) => {
        oxr.latest(function() {
            if (oxr.error) {
                reject(oxr.error);
            }

            resolve({rates: oxr.rates, base: oxr.base});
        });
    })
}

function getSum(data, place) {
    return data.filter((rawData) => rawData.place === place)
    .map(rawValue => rawValue.value)
    .reduce((previousValue, currentValue, index, array) => {
        let sum = previousValue + currentValue;
        return sum;
    });
}
