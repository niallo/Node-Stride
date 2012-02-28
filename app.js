
/**
 * Module dependencies.
 */

var express = require('express')
  , config = require('./config')
  , crypto = require('crypto')
  ;

// Configuration

app = module.exports = express.createServer();


app.configure(function(){
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
