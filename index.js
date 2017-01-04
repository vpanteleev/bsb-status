let fs = require('fs');
let readline = require('readline');
let google = require('googleapis');
let googleAuth = require('google-auth-library');
let moment = require('moment');
let oxr = require('open-exchange-rates');
let fx = require('money');
let babar = require('babar');
let rates = require('./rates.json');

oxr.set({app_id: '00a00828253e4b67841fc0161fde095d'})

// If modifying these scopes, delete your previously saved credentials
// at ~/.credentials/gmail-nodejs-quickstart.json
var SCOPES = ['https://www.googleapis.com/auth/gmail.readonly'];
var TOKEN_DIR = (process.env.HOME || process.env.HOMEPATH || process.env.USERPROFILE) + '/.credentials/';
var TOKEN_PATH = TOKEN_DIR + 'gmail-nodejs-quickstart.json';

// Load client secrets from a local file.
fs.readFile('client_secret.json', (err, content) => {
    if (err) {
        console.log('Error loading client secret file: ' + err);
        return;
    }
    // Authorize a client with the loaded credentials, then call the
    // Gmail API.
    authorize(JSON.parse(content), getStatistics);
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
    fs.readFile(TOKEN_PATH, (err, token) => {
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
    var authUrl = oauth2Client.generateAuthUrl({access_type: 'offline', scope: SCOPES});
    console.log('Authorize this app by visiting this url: ', authUrl);
    var rl = readline.createInterface({input: process.stdin, output: process.stdout});
    rl.question('Enter the code from that page here: ', code => {
        rl.close();
        oauth2Client.getToken(code, (err, token) => {
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
function getStatistics(auth) {
    let gmail = google.gmail('v1');
    let messages;
    gmail.users.messages.list({
        auth: auth,
        userId: 'me',
        q: 'bsb-bank card transaction after:2016/12/01 before:2017/01/01'
    }, function(err, response) {
        if (err) {
            console.log('The API returned an error: ' + err);
            return;
        }
        getMessages = response.messages.map(message => new Promise((resolve, reject) => {
            gmail.users.messages.get({
                auth: auth,
                userId: 'me',
                id: message.id
            }, (err, response) => {
                if (err) {
                    reject('The API returned an error: ' + err);
                }

                resolve(response);
            })
        }));

        return getCurrencyExchangeRates().then(rates => {
            Object.assign(fx, oxr);
            fs.writeFile('./rates.json', JSON.stringify(oxr, null, 2), 'utf-8');
        }).catch(err => {
            Object.assign(fx, rates);
        }).then(() => {
            return Promise.all(getMessages).then(res => {
                let data = res
                    .map(message => message.snippet)
                    .map(parseDataString)
                    .filter((rawData) => rawData.date && rawData.value && rawData.place)
                    .map(convertCurrency);

                let places = data.map(rawData => rawData.place);
                let uniquePlaces = places.filter((elem, pos) => places.indexOf(elem) == pos);

                let valueByPlace = uniquePlaces.map((place) => {
                    return {
                        place,
                        value: getSum(data, place)
                    };
                }).sort((a, b) => (b.value - a.value));

                let barsValues = valueByPlace.map((bar, index) => [index, bar.value]);
                let valueByPlaceView = valueByPlace.map((bar, index) => [
                    index,
                    bar.place,
                    Math.round(bar.value)
                ]);

                console.log(babar(barsValues, {
                    color: 'green',
                    width: 160,
                    height: 20,
                    yFractions: 1
                }));
                console.log(valueByPlaceView);
            });
        });
    });
}

function getCurrencyExchangeRates() {
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
        .reduce((previousValue, currentValue, index, array) => (previousValue + currentValue));
}

function parseDataString(data) {
    let arr = data.split(/Summa:|Ostatok:/);
    let date = moment((arr[0].split(/Uspeshno/)[1] || '').trim()).toDate();
    let value = parseFloat((arr[1] || '').trim().slice(0, -4));
    let currency = (arr[1] || '').trim().slice(-3);
    let place = (arr[2].split(/BYN/)[1] || '').trim();

    return {date, value, currency, place};
}

function convertCurrency(rawData) {
    let data = Object.assign({}, rawData);
    if (data.currency !== 'BYN') {
        data.value = fx(data.value).from(data.currency).to('BYN');
        data.currency = 'BYN';
    }

    return data;
}
