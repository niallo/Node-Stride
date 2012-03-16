// Shared secret to verify the HMAC-SHA1 Webhook signature
exports.webhook_secret = "mysecret";

// Server port
exports.server_port = 3001;

// The URI path
exports.path = '/deploy-webhook';

// The shell command to launch the deploy.
exports.deploy_cmd = "cd deploy ; fab deploy";

// Loggly config (optional)
exports.loggly = {
  enabled: false,
  subdomain: "your-subdomain",
  // set input to false if you don't want to use one
  input: "node-stride",
  auth: {
    username: "your-username",
    password: "your-password"
  }
};
