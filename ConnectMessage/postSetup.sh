#!/bin/bash
echo "Be sure to run 'az login' first"
echo " "
echo "What is your resource group name?"
read rg
echo "What is your FunctionApp name?"
read functionApp

az deployment group create --name sdDeployment --resource-group $rg --template-file template.json
connectionstr=$(az servicebus namespace authorization-rule keys list --resource-group $rg --namespace-name Example-Connect-Events-DS --name RootManageSharedAccessKey --query primaryConnectionString --output tsv)
az functionapp config appsettings set --name $functionApp --resource-group $rg --settings "SVC_BUS_CONNECTION_STRING=$connectionstr"  