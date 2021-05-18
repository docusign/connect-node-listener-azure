 /**
 * @file index.js -- Azure Function Node.js function.
 * This function receives a DocuSign Connect notification message
 * and enqueues it to an Azure Service Bus queue.
 **/

'use strict';

const crypto = require('crypto')
    , { ServiceBusClient } = require("@azure/service-bus")  // See https://github.com/Azure/azure-sdk-for-js/tree/master/sdk/servicebus/service-bus/
    ;

const debug = true;

const sleep = (milliseconds) => {
    return new Promise(resolve => setTimeout(resolve, milliseconds))
}

module.exports.connectNotificationMessage = async function (context, req) {
  context.log('JavaScript HTTP trigger function processed a request.');

  const debugLog = msg => {if (debug) {context.log(msg)}};
  const invocationId = context.executionContext && context.executionContext.invocationId;

  function checkBasicAuth() {
      const name = process.env['BASIC_AUTH_NAME']
          , pw = process.env['BASIC_AUTH_PW']
          , authRaw0 = (req.headers && req.headers.authorization) || ''
          , authRaw = authRaw0.split(' ')[1]  || ''
          , authString = Buffer.from(authRaw, 'base64').toString()
          , authArray = authString.split(':')
          , authenticated = name == authArray[0] && pw == authArray[1]
          ;
      return authenticated
  }
  
  debugLog(`Started!. Invocation ID: ${invocationId}`);
  // Check Basic Authentication 
  if (checkBasicAuth()) {
      debugLog("Authenticated!")
  } else {
      const headers = {'WWW-Authenticate': 'Basic realm="Connect Listener", charset="UTF-8"'};
      context.res = {status: 401, body: "Unauthorized!", headers: headers};
      return // EARLY return  
  }

  // Check HMAC and enqueue. Allow for test messages
  const test = req.query.test ? req.query.test : false
      , rawBody = req.body
      , hmac1 = process.env['HMAC_1']
      , hmacConfigured = hmac1;

  let body;
  debugLog(`content-type is ${req.headers['content-type']}`)

  if (req.headers['content-type'].toString().includes('text/xml')) {
      body = rawBody
  } else if (req.headers['content-type'].toString().includes('application/json')) {
      body = JSON.stringify(rawBody)
  }
  
  let hmacPassed;
  if (!test && hmacConfigured) {
      // Not a test:
      // Step 1. Check the HMAC
      // get the headers
      const authDigest = req.headers['x-authorization-digest']
          , hmacSig1 = req.headers['x-docusign-signature-1']
          ;
      
      hmacPassed = checkHmac(hmac1, body, authDigest, hmacSig1)
      if (!hmacPassed) {
          context.log.error(`HMAC did not pass!! HMAC Sig 1: ${hmacSig1}`);
          context.res = {status: 401, body: "Bad HMAC: unauthorized!"};
          return // EARLY return      
      }
      if (hmacPassed){
          debugLog('HMAC passed!')
      }
  } else {
      // hmac is not configured or a test message. HMAC is not checked for tests.
      hmacPassed = true
  }
  
  if (test || hmacPassed) {
      // Step 2. Store in queue
      let  error = await enqueue (rawBody, test);
      if (error) {
          // Wait 25 sec and then try again
          await sleep(25000);
          error = await enqueue (rawBody, test);
      }
      if (error) {
          context.res = {status: 400, body: `Problem! ${error}`}
          context.log.error(`Enqueue error: ${error}`);
      } else {
          context.res = {status: 200, body: 'enqueued'};

          if (test) {
              debugLog (`Enqueued a test notification: ${test}`)
          } else {
              debugLog (`Enqueued a notification`)
          }
      }
  } 
};

/**
 * 
 * @param {string} key1: The HMAC key for signature 1
 * @param {string} rawBody: the request body of the notification POST 
 * @param {string} authDigest: The HMAC signature algorithmn used
 * @param {string} hmacSig1: The HMAC Signature number 1
 * @returns {boolean} sigGood: Is the signatures good?
 */
function checkHmac (key1, rawBody, authDigest, hmacSig1) {   
  const authDigestExpected = 'HMACSHA256'
      , correctDigest = authDigestExpected === authDigest;
  if (!correctDigest) {return false}

  // The key is relative to the account. So if the 
  // same listener is used for Connect notifications from 
  // multiple accounts, use the accountIdHeader to look up
  // the secrets for the specific account.
  //
  // For this example, the key is supplied by the caller
  const sig1good = hmacSig1 === computeHmac(key1, rawBody);
  return sig1good
}

/**
* Compute a SHA256 HMAC on the <content> with the <key>
* The Base64 representation of the HMAC is then returned 
* @param {string} key 
* @param {*} content
* @returns {string} Base64 encoded SHA256 HMAC 
*/
function computeHmac(key, content) {
  const hmac = crypto.createHmac('sha256', key);
  hmac.write(content);
  hmac.end();
  return hmac.read().toString('base64');
}


/**
* The enqueue function adds the xml to the queue.
* If test is true then a test notification is sent. 
* 
* @param {string} rawBody 
* @param {boolean||integer} test 
*/
async function enqueue(rawBody, test) {
  if (!test) {test = ''} // always send a string
  let error = false;
  if (test) {rawBody = ''} 

  let ns;
  try {
      const connString = process.env['SVC_BUS_CONNECTION_STRING']
          , queueName = process.env['SVC_BUS_QUEUE_NAME'];
      ns = ServiceBusClient.createFromConnectionString(connString);
      const client = ns.createQueueClient(queueName)
          , sender = client.createSender()
          , message = {body: {test: test, xml: rawBody}}
          ;
      await sender.send(message);
      await client.close();
  }
  catch (e) {
      error = e
  }
  finally {
      if (ns) {await ns.close()}
  }
  return error
}