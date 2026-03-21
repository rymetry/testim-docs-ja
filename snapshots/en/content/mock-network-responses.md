# Mock Network Responses

## Overview

Testim offers the ability to mock network traffic of the Application Under Test (AUT) as part of a test. During the test run, instead of performing real calls, the system will intercept the call and will return a mocked response.

For example, let's say your site generates calls to an analytics system on every page that is browsed. In this case, instead of generating real calls to the analytics system, Testim will intercept the network traffic, and return "success code" responses. This feature is especially useful in development environments, where the integrations with external services are not stable, or sometimes don’t exist.

The mocking of network traffic also expedites the testing process, as the system does not have to wait until a real response is returned, and in some cases can even save money if you are charged by the number of calls you send to a service.

It is possible to mock network responses in two ways:

* [**Mocking network traffic using a HAR file**](https://help.testim.io/docs/mocking-all-the-network-traffic-using-a-har-file) - The mock network responses can be based on a HAR file. The HAR file is a JSON-formatted archive file format for logging a web browser's interaction with a site. All the HTTP calls and responses are recorded in this file. Testim will automatically use the relevant data in the HAR file as the test run is being executed. See [here](https://help.testim.io/docs/mocking-all-the-network-traffic-using-a-har-file#running-your-test-using-the-har-file) for detailed instructions.
* [**Mocking specific behaviors using a Mapping file**](https://help.testim.io/docs/creating-a-mapping-file)  -  In this option, instead of using a HAR file or in addition to using it, is to provide a Mapping file. The mapping file is a JSON file that includes specific mock behavior. In some cases, the Mapping file can be added in addition to the HAR file. For example, to mock specific calls that you are unsure if they are included in the HAR file or if you want to override the response in the HAR file with a different response. For example, the HAR file includes an error code response and you want to use the mapping file, which includes a success response. See detailed [instructions](https://help.testim.io/docs/creating-a-mapping-file).

> 🚧 Tests that include a login process
>
> If your test includes a login process, which involves passing credentials to a server, it may not work properly when running the test on the mock network, as the login request will be timed out. To solve this issue, you should enable **Pass-through Authentication** when sending the login request. To do so, you will have to add a mapping file with the login request and the enabled Pass-through authentication property. For detailed instructions see [Uploading the mapping file](https://help.testim.io/docs/creating-a-mapping-file#section-uploading-the-mapping-file).

> 📘 This is a pro feature
>
> This feature is only open to projects on our professional plan. To learn more about our professional plan, click [here](https://www.testim.io/pricing/).

### Running the Test with Mock Network Responses

Mocked network responses will be enabled after recording a HAR file or uploading a HAR file or a mapping file. While running the test, Testim will try to match each request being made using the following algorithm:

* **If a Mapping file was specified** - Testim will iterate over its entries list. The first rule entry to match either only the **request URL** or both the **URL** and the **HTTP method** will be used to mock the response.
* **If the entries list is exhausted without finding a match and a HAR file exists** - Testim will iterate over its entries list matching the first not already used entry which matches both the **request URL** and the **HTTP method**.
* **If no match was found**, the response will not be mocked and instead Testing will perform the actual request.

> 🚧 Please note
>
> For the mapping file, the same request can be used unlimited times.\
> For the HAR file, if we found a match and used it, this request will not be used again.