Guidelines to follow:

Follow code review guidelines  Code Review Guide 

Code Coverage >80%

Conditional Coverage >95%

Minimum 2 reviewer are must to merge

Sonar violations all Major and above should be fixed. critical should be blocked to merge

Make use of common modules: zeta-commons, plutus-commons,

Identify common methods/APIs/Util functions etc.. and write in to plutus-commons / turbo-commons or create one if not exist

Use Crux for Multi-tenancy, an abstraction lib for AuthN/Z flows to access Olympus resources

Crux onboarding for an backend application

Crux - Documentation

Crux Token Generation Use Guide

KT Content

Store Secrets in to Hashicorp Vault

Store application configs in to Spring Cloud Config Server [POC in progress] [do not use Delta] and not pass it from application.prop files within the build. [Details of Spring Cloud Config Server will be updated here[

Modularity of code, 

API versioning is a must have in all services

Design patterns - ex: Builder pattern should be followed for constructors initialisation

Entity mappers / transformers 

Use wire-mock or any other mock server locally http://wiremock.org/docs/docker/  to unblock the development as long as we have the contract documented from dependency team and a sample dataset is available with appropriate data types for the fields in contract

Use of Java.time over Java.util.Data

Use of standard JDK classes like currency

Using google coding style format in your IDE

Add Javadocs as much as possible (crisply without spell errors slightly smiling face )

 My First checkin: What do i need to do

If its new service all together

Create repo(s)

Create ‘rose’ CI Jenkins pipeline request @ Zeta Foundry CI & Rapido Support 

Deploy the artefact in beta [must have]

Decide the k8s cluster/namespace name. Reach out to PE/TA for help. ex cluster for ex service:  Firebase Token Service belong to plutuscommons

First create helm chart entry 
plutus-helm: helm-charts/plutus-hdfc-beta/values.yaml 

Trigger Chart museum publisher with filter(text field) param as 'plutus-hdfc-beta' https://buildplutus.internal.ciaas.zetaapps.in/job/plutus-chartmuseum-jfrog-publish/

Create E&E criteria form to SRE for deployment to UAT/PROD 
HDFC - Entry & Exit Criteria Template 

If its existing service:

Know the repo, code flow & find the artefact at https://buildplutus.internal.ciaas.zetaapps.in/ 

make a checkin and verify it in Beta 

Understand the SRE process for UAT deployment 
HDFC SRE Team 

Refer Zeta level guidelines 
 

More coming soon….

 