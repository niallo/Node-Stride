
/**
 * Module dependencies.
 */

var express = require('express')
  , config = require('./config')
  , crypto = require('crypto')
  ;

// Configuration

app = module.exports = express.createServer();

// Custom middleware to save unparsed POST request body to req.post_body
bodySetter = function(req, res, next) {
    if (req._post_body) return next();
    req.post_body = req.post_body || "";

    if ('POST' != req.method) return next();

    req._post_body = true;

    req.setEncoding('utf8');
    req.on('data', function(chunk) {
      req.post_body += chunk;
    });

    next();
}

/*
 * verify_webhook_sig()
 *
 * Verify HMAC-SHA1 signatures.
 *
 * <sig> Signature.
 * <secret> Shared secret, the HMAC-SHA1 was supposedly generated with this.
 * <body> The message body to sign.
 */
function verify_webhook_sig(sig, secret, body)
{
  var hmac = crypto.createHmac('sha1', secret);
  hmac.update(body);
  var digest = hmac.digest('hex');
  return sig == digest;
}

/*
 * verify_webhook_req()
 *
 * Verify the X-Hub-Signature HMAC-SHA1 header used by Strider webhooks.
 *
 * <req> Express request object.
 * <callback> function(boolean result)
 */
function verify_webhook_req(req, callback)
{
  var sig;
  if ((sig = req.headers['x-hub-signature']) === undefined) {
    callback(false);
  }
  if (req.body["payload"] === undefined) {
    callback(false);
  }
  sig = sig.replace('sha1=','');

  var payload = JSON.parse(req.body.payload);

  callback(verify_webhook_sig(sig, config.repo_secret, req.post_body));
}


app.configure(function(){
  app.use(bodySetter);
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure('production', function(){
  app.use(express.errorHandler());
});


// handlers

app.post('/webhook', function(req, res) {
  console.log("params payload: %s", req.params.payload);
  console.log("body payload: %s", req.body.payload);
  res.end();
});

app.listen(config.server_port);
console.log("Node Stride server listening on port %d in %s mode", app.address().port, app.settings.env);
