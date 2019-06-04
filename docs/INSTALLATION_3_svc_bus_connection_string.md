# Create a Shared Access Policy

#### Summary
Use this article to create a 
**Shared access policy** and **Connection string**
for your Service Bus Namespace.

The connection string will be used by both
the listener function and the worker application.

#### Steps
1. Open the 
   [Azure Resource groups](https://portal.azure.com/#blade/HubsExtension/BrowseResourceGroupBlade/resourceType/Microsoft.Resources%2Fsubscriptions%2FresourceGroups)
   page.
1. Click on your resource group's name.
1. Your resource group's page will be shown.
   Click on your resource that has **Type**
   **Service Bus Namespace**. This will be the 
   resource you created with the previous article.
1. The page for your Service Bus Namespace will be shown. 
   
   In the middle-left navigation column,
   click **Shared access policies**. See figure 1.

   ![Service Bus Namespace](Azure.04.svc.namespace.page.png)
   
   Figure 1. The page for your Service Bus Namespace. Click **Shared access policies**.

1. The list of Shared access policies for your namespace 
   will be shown.

   Click **+ Add** near the top of the page.

1. The **Add SAS Policy** form modal will be shown.
   Complete the form and 
   check the **Send** and **Listen** options.
   
   Then click **Create** at the bottom of the form.
   See figure 2:    

   ![Add policy](Azure.05.add.policy.png)
   
   Figure 2. Complete the form and 
   click **Create**

1. After the policy has been created, the 
   Shared access policies page will show the policy
   in the list.

   Click on the policy name to open its details.

   Record the **Primary Connection String** of the
   policy. You will use it for both the listener
   function and worker application settings. See figure 3.

   
   ![connection string](Azure.06.connection.string.png)

   Figure 3. Record the **Primary Connection String** of the
   policy

Next: Create a 
[Service Bus Queue](INSTALLATION_4_svc_bus_queue.md).