# VSTS and TFS integration

​

![404](https://files.readme.io/d30e448-tfs1.png "tfs1.png")

​In order to integrate your tests with VSTS/TFS, first you need to have docker installed on the VSTS/TFS agent.

### Now, just follow these steps:

1. Go to Build page

![600](https://files.readme.io/e8e8d07-tfs2.png "tfs2.png")

​2. Create a new build

![591](https://files.readme.io/c4affba-tfs3.png "tfs3.png")

​3. Select your repository

![961](https://files.readme.io/3f92a44-tfs4.png "tfs4.png")

4. Select empty job

![961](https://files.readme.io/a3f06a9-tfs5.png "tfs5.png")

5. Add task

![429](https://files.readme.io/6175fc6-tfs6.png "tfs6.png")

6. Add Docker task

![758](https://files.readme.io/c4e0e7a-tfs7.png "tfs7.png")

7. Select Action: Run a Docker command

![759](https://files.readme.io/93a38c4-tfs8.png "tfs8.png")

8. Set the Command with the appropriate parameters, as described in the [CLI page](https://help.testim.io/docs/the-command-line-cli). Here is the basic command template.

```shell
run --rm -v $(Build.BinariesDirectory):/opt/testim-runner testim/docker-cli --token <TOKEN> --project <PROJECT-ID> --grid <GRID-NAME> --report-file /opt/testim-runner/testim-sanity-$(Build.BuildId)-report.xml
```

![708](https://files.readme.io/76b5b0e-tfs9.png "tfs9.png")

​ **Note**:  For the grid name, read [here](https://help.testim.io/docs/grid-management) how to set up your grid.

9. In order for VSTS/TFS to store, analyze and show the results, we generate a standard JUnitXMLReporter XML file.\
   For VSTS/TFS to use the file you need to add a Publish Test Results task

![753](https://files.readme.io/a99d051-tfs10.png "tfs10.png")

10. Select Test result format: JUnit

![659](https://files.readme.io/c8ae6c1-tfs11.png "tfs11.png")

11. Set the Test results files value, according to the "report-file" parameter in section 8 and set the

![654](https://files.readme.io/83f530c-tfs12.png "tfs12.png")

12. Set the Search folder **$(Build.BinariesDirectory)**

![654](https://files.readme.io/254a96d-tfs13.png "tfs13.png")

13. Save the build settings

![221](https://files.readme.io/5d80b20-tfs14.png "tfs14.png")

​

​\
​