
/**
 * Module dependencies.
 */

var express = require('express')
  , exec = require('child_process').exec
  , config = require('./config')
  , crypto = require('crypto')
  , loggly = require('loggly')
  ;

// Configuration

app = module.exports = express.createServer();

// Loggly
var loggly;

if (config.loggly.enabled === true) {
  console.log("Loggly enabled - creating client");
  loggly = loggly.createClient(config.loggly);
  if (config.loggly.input !== false) {
    loggly.getInput(config.loggly.input, function(err, input) {
      if (err) throw err;
      loggly = input;
    });
  }
}

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
    return;
  }
  if (req.body["payload"] === undefined) {
    callback(false);
    return;
  }
  sig = sig.replace('sha1=','');

  var payload = JSON.parse(req.body.payload);

  if (!verify_webhook_sig(sig, config.webhook_secret, req.post_body)) {
    return callback(false);
  }

  if (payload.test_results === undefined) {
    return callback(false);
  }

  if (payload.test_results.test_exitcode != 0) {
    return callback(false);
  }

  callback(true);
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

function log(msg) {
  console.log(msg);
  if (loggly !== undefined) {
    loggly.log(msg);
  }
}

// handlers


//
// Simple mehanism to guard against concurrent, overlapping deploys.
//
// If a deploy is in progress when a valid webhook comes in,
// that webhook will simply be ignored.
//
var exec_lock = false;

app.post(config.path, function(req, res) {
  console.log("Received a webhook");
  verify_webhook_req(req, function(webhook_ok) {
    if (!webhook_ok) {
      log("Bad webhook signature");
      res.statusCode = 400;
      res.end("Bad signature");
      return;
    }
    log("Good webhook signature. Launching command: " + config.deploy_cmd);
    if (!exec_lock) {
      // Take the lock
      exec_lock = true;
      exec(config.deploy_cmd, function(error, stdout, stderr) {
        if (error !== null) {
          log("Error executing deploy command `"+ config.deploy_cmd + "`: " + error);
        } else {
          log("Successfully executed deploy command. Output: "+ stdout + stderr);
        }
        // Done - yield the lock
        exec_lock = false;
      });
    }

    res.end();
  });
});
app.listen(config.server_port);
console.log("Node Stride server listening on port %d in %s mode", app.address().port, app.settings.env);
