/**
 * @file index.js -- Azure Function Node.js function.
 * This function receives a DocuSign Connect notification message
 * and enqueues it to an Azure Service Bus queue.
 * 
 * Environment variables
 * BASIC_AUTH_NAME  -- used to enforce basic authentication for the function's url
 * BASIC_AUTH_PW
 * HMAC_1 -- the HMAC secret for HMAC signature 1. Can be omitted if HMAC not configured
 * SVC_BUS_CONNECTION_STRING 
 * SVC_BUS_QUEUE_NAME
 * 
 * References
 * Azure Functions JS Developer Guide: https://docs.microsoft.com/en-us/azure/azure-functions/functions-reference-node
 */

const crypto = require('crypto')
    , { ServiceBusClient } = require("@azure/service-bus")  // See https://github.com/Azure/azure-sdk-for-js/tree/master/sdk/servicebus/service-bus/
    ;

const debug = true;

const sleep = (milliseconds) => {
    return new Promise(resolve => setTimeout(resolve, milliseconds))
}

module.exports = async function _connectNotificationMessage (context, req) {
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
        , rawXML = req.body
        , hmac1 = process.env['HMAC_1']
        , hmacConfigured = hmac1;

    let hmacPassed;
    if (!test && hmacConfigured) {
        // Not a test:
        // Step 1. Check the HMAC
        // get the headers
        const authDigest = req.headers['x-authorization-digest']
            , accountIdHeader = req.headers['x-docusign-accountid']
            , hmacSig1 = req.headers['x-docusign-signature-1']
            ;
        hmacPassed = checkHmac(hmac1, rawXML, authDigest, accountIdHeader, hmacSig1)
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
        let  error = await enqueue (rawXML, test);
        if (error) {
            // Wait 25 sec and then try again
            await sleep(25000);
            error = await enqueue (rawXML, test);
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
 * @param {string} rawXML: the request body of the notification POST 
 * @param {string} authDigest: The HMAC signature algorithmn used
 * @param {string} accountIdHeader: The account Id from the header
 * @param {string} hmacSig1: The HMAC Signature number 1
 * @returns {boolean} sigGood: Is the signatures good?
 */
function checkHmac (key1, rawXML, authDigest, accountIdHeader, hmacSig1) {    
    const authDigestExpected = 'HMACSHA256'
        , correctDigest = authDigestExpected === authDigest;
    if (!correctDigest) {return false}

    // The key is relative to the account. So if the 
    // same listener is used for Connect notifications from 
    // multiple accounts, use the accountIdHeader to look up
    // the secrets for the specific account.
    //
    // For this example, the key is supplied by the caller
    const sig1good = hmacSig1 === computeHmac(key1, rawXML);
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
 * @param {string} rawXML 
 * @param {boolean||integer} test 
 */
async function enqueue(rawXML, test) {
    let error = false;
    if (test) {rawXML = ''}

    let ns;
    try {
        const connString = process.env['SVC_BUS_CONNECTION_STRING']
            , queueName = process.env['SVC_BUS_QUEUE_NAME'];
        ns = ServiceBusClient.createFromConnectionString(connString);
        const client = ns.createQueueClient(queueName)
            , sender = client.createSender()
            , message = {body: {test: test, xml: rawXML}}
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