let promisify = require("promisify-node");
let fs = promisify("fs");
let readline = require('readline');
let google = require('googleapis');
let googleAuth = require('google-auth-library');
let moment = require('moment');
let oxr = require('open-exchange-rates');
let fx = require('money');
let babar = require('babar');
let rates = require('./rates.json');
let placeMapper = require('./places.json');
let gmail = google.gmail('v1');
let creds = require('./creds.json');
let plotly = require('plotly')(creds.plotly.owner, creds.plotly.token);
let TelegramBot = require('node-telegram-bot-api');
var bot = new TelegramBot(creds.telegram.botToken, { polling: true });

bot.onText(/\/getStatistics (.+)/, function (msg, match) {
  // 'msg' is the received Message from Telegram
  // 'match' is the result of executing the regexp above on the text content
  // of the message

  console.log('GET REQUEST');
  var chatId = msg.chat.id;

  // send back the matched "whatever" to the chat
  return getStatistics()
    .then((msg) => {
        bot.sendMessage(chatId, msg.url);
        var fileStream = fs.createReadStream(`public/${msg.filename}.png`);
        bot.sendPhoto(chatId, fileStream);
    })
});

oxr.set({app_id: creds.oxr.app_id});

// If modifying these scopes, delete your previously saved credentials
// at ~/.credentials/gmail-nodejs-quickstart.json
let SCOPES = ['https://www.googleapis.com/auth/gmail.readonly'];
let TOKEN_DIR = (process.env.HOME || process.env.HOMEPATH || process.env.USERPROFILE) + '/.credentials/';
let TOKEN_PATH = TOKEN_DIR + 'gmail-nodejs-quickstart.json';

function getStatistics() {
    return getCurrencyExchangeRates()
        .then(() => fs.readFile('client_secret.json'))
        .then(data => authorize(JSON.parse(data)))
        .then((oauth) => getMessageList(oauth)
                .then(response =>
                    Promise.all(response.messages.map(message => getMessage(oauth, message)))
                )
        ).then(res => {
            let data = res
                .map(message => parseDataString(message.snippet))
                .filter((rawData) => rawData.date && rawData.value && rawData.place)
                .map(convertCurrency)
                .map(rawData => {
                    let place = placeMapper[rawData.place] || rawData.place;

                    return Object.assign(rawData, {place});
                });

            let places = data.map(rawData => rawData.place);
            let uniquePlaces = places.filter((elem, pos) => places.indexOf(elem) === pos);

            let valueByPlace = uniquePlaces.map((place) => {
                return {
                    place,
                    value: getSum(data, place)
                };
            }).sort((a, b) => (b.value - a.value));

            var barsData = [
              {
                x: valueByPlace.map((rawData) => rawData.place),
                y: valueByPlace.map((rawData) => rawData.value),
                type: "bar",
              }
            ];

            var graphOptions = {filename: `${+new Date()}`, fileopt: "overwrite"};

            return createChart(barsData, graphOptions).then((msg) => {
                console.log('Done!')
                return msg;
            });
        }).catch(console.error);
}

function authorize(credentials) {
    let clientSecret = credentials.installed.client_secret;
    let clientId = credentials.installed.client_id;
    let redirectUrl = credentials.installed.redirect_uris[0];
    let auth = new googleAuth();
    let oauth2Client = new auth.OAuth2(clientId, clientSecret, redirectUrl);
    // Check if we have previously stored a token.
    return fs.readFile(TOKEN_PATH)
        .then(token => Object.assign(oauth2Client, {credentials: JSON.parse(token)}))
        .catch(e => getNewToken(oauth2Client));
}

function getNewToken(oauth2Client) {
    return new Promise((resolve, reject) => {
        let authUrl = oauth2Client.generateAuthUrl({access_type: 'offline', scope: SCOPES});
        console.log('Authorize this app by visiting this url: ', authUrl);
        let rl = readline.createInterface({input: process.stdin, output: process.stdout});
        rl.question('Enter the code from that page here: ', code => {
            rl.close();
            oauth2Client.getToken(code, (err, token) => {
                if (err) {
                    reject(err);
                }
                oauth2Client.credentials = token;
                storeToken(token);
                resolve(oauth2Client);
            });
        });
    });
}

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

function getMessage(auth, message) {
    return new Promise((resolve, reject) => {
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
    })
}

function getMessageList(auth) {
    return new Promise((resolve, reject) => {
        gmail.users.messages.list({
            auth: auth,
            userId: 'me',
            q: 'bsb-bank card transaction after:2016/12/01 before:2017/01/01'
        }, function(err, response) {
            if (err) {
                reject(err);
            }

            resolve(response);
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
    }).then(rates => {
        Object.assign(fx, oxr);
        fs.writeFile('./rates.json', JSON.stringify(oxr, null, 2), 'utf-8');
    }).catch(err => {
        Object.assign(fx, rates);
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

function createChart(data, graphOptions) {
    return new Promise((resolve, reject) => {
        plotly.plot(data, graphOptions, function (err, msg) {
            plotly.getFigure('vpanteleev', msg.url.split('/').pop(), function (err, figure) {
                let imgOpts = {
                    format: 'png',
                    width: 1280,
                    height: 720
                };

                plotly.getImage(figure, imgOpts, function (error, imageStream) {
                    var fileStream = fs.createWriteStream(`public/${graphOptions.filename}.png`);
                    imageStream.pipe(fileStream);
                    fileStream.on('finish', () => {
                        resolve(msg)
                    });
                });
            });
        });
    });
}
