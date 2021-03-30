# Connect Node Listener for Azure

This application is a microservice for use with 
[Azure Functions](https://azure.microsoft.com/en-us/services/functions/).

It acts as a server (a **listener**) for DocuSign
Connect notification messages. After checking the 
message's Basic Authentication and HMAC values,
the software enqueues the message onto an
[Azure Service Bus](https://azure.microsoft.com/en-us/services/service-bus)
queue for processing by other software apps.

The repo 
[connect-node-worker-azure](../../../connect-node-worker-azure)
is an example worker application.
It receives messages from the queue
and then processes
them. See the repo for more information.

## Architecture
![Connect listener architecture](docs/connect_listener_architecture.png)

This figure shows the solution's architecture. 
This application is written in Node.js. 
The example worker app is also written in Node.js but 
could be written in a different language.

## Installation

Short form instructions are below. 
[Long form](INSTALLATION.md) instructions are also available.

## Infrastructure

To deploy the needed infra using the Serverless framework follow [these instructions](connectMessage/INFRA.md) below. 

### Azure Service Bus Namespace
1. Provision an 
   [Azure Service Bus](https://azure.microsoft.com/en-us/services/service-bus/) **Namespace**.

1. Add a Shared access policy for the namespace. The policy will need
   **Send** and **Listen** scopes.

1. Record the **Primary Connection String** for the 
   Shared access policy.

   The connection string is used 
   for the `SVC_BUS_CONNECTION_STRING` setting for
   the listener function and the worker application. 

1. Create a **Queue** in the namespace. Record the 
   **Queue name**.

   The queue name is used 
   for the `SVC_BUS_QUEUE_NAME` setting for 
   the listener function and the worker application. 

### Azure Function
1. Provision an Azure Function.

   **Runtime Stack**: `JavaScript`.

   The OS can be either Windows or Linux.

   Note the URL for the cloud function.
   Your DocuSign Connect subscription will be 
   configured with this URL.

1. Download/clone this repo to a local directory.
1. Install Node.js version 8.x or later.
1. In the project's directory: `npm install`
1. Use the VS Code or other tools suggested by 
   Azure to upload the directory to your Azure function.

1. Set the environment (settings) variables for the function:
   1. **BASIC_AUTH_NAME**: optional. The Basic Authentication
      name set in the Connect subscription.
   1. **BASIC_AUTH_PW**: optional. The Basic Authentication
      password set in the Connect subscription.
   1. **HMAC_1**: optional. The HMAC secret used by the
      Connect subscription.
   1. **SVC_BUS_CONNECTION_STRING**: required. 
      The connection string for a
      Shared access policy to the queue. 
   1. **SVC_BUS_QUEUE_NAME**: required. 

## Testing
Configure a DocuSign Connect subscription to send notifications to
the Azure Function. Create / complete a DocuSign envelope.
Check the Connect logs for feedback.

### Test messages feature
This application and the worker application enable test
messages to be sent via the queuing system. The test
messages do not include XML Connect notification
messages. 

To send a test message, use the function's URL with
query parameter `test` set to
a test value. A GET or POST request can be used. 

### Integration testing
The worker application includes the test tool `runTest.js` 

See the worker application for information on running the
integration tests.

## Usage
**Do not include documents in the notification messages**
The Message Bus queuing system will not support messages that
include documents. Check that your Connect subscription
is configured to not include envelope documents nor the
envelope's Certificate of Completion.

## License and Pull Requests

### License
This repository uses the MIT License. See the LICENSE file for more information.

### Pull Requests
Pull requests are welcomed. Pull requests will only be considered if their content
uses the MIT License.

