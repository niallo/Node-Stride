Node-Stride is a simple Node.JS server for handling Strider Continuous Deployment webhooks.

It enables easy integration of custom deploy logic into your CD pipeline. We
use this to continuously deploy Strider itself on IaaS.


Installing
==========

Simply run `npm install` to fetch and install dependencies.


Configuration
=============

You will certainly wish to change most if not all configuration parameters in config.js:

<webhook_secret> - This is the shared secret used to verify the Strider webhook's HMAC-SHA1 signature.

<server_port> - Port to listen on.

<path> - URI path component for Webhook. Defaults to /deploy-webhook.

<deploy_cmd> - Last but not least, the shell command to launch your deployment.
We use Fabric, so we execute `fab deploy` to power ours.


Usage
=====

Deploy Node-Stride as you would any Node.JS / Express application. We recommend setting NODE_ENV=production:

    NODE_ENV=production node app.js
