---
title: 設定ファイルフックの事前定義プロパティ
description: 設定ファイルの Before/After Suite ・ Test フックで参照できる事前定義プロパティと、その用途の概要を一覧で説明します。
category: テスト実行
order: 6012
updated: '2025-09-22'
sourceUrl: 'https://help.testim.io/docs/predefined-properties-in-config-file-hooks'
keywords:
  - 設定ファイル
  - run hooks
  - 事前定義プロパティ
  - Before Suite
  - After Suite
  - Before Test
  - After Test
  - 実行情報
  - Testim
  - config hooks
---

以下では、各種設定フックで利用できる事前定義プロパティを紹介します。これらは実行の「 info 」に含まれる情報で、テスト／スイートに関する追加情報を取得するのに利用できます。例えば、 Before Suite フックで `projectId` の値を出力できます。

## Before Suite の事前定義プロパティ

<table class="md-table md-table-3cols">
 <thead>
  <tr>
   <th style="text-align: left;">
    プロパティ名
   </th>
   <th style="text-align: left;">
    説明
   </th>
   <th style="text-align: left;">
    用途
   </th>
  </tr>
 </thead>
 <tbody>
  <tr>
   <td style="text-align: left;">
    projectId
   </td>
   <td style="text-align: left;">
   </td>
   <td style="text-align: left;">
   </td>
  </tr>
  <tr>
   <td style="text-align: left;">
    executionId
   </td>
   <td style="text-align: left;">
   </td>
   <td style="text-align: left;">
   </td>
  </tr>
 </tbody>
</table>

## After Suite の事前定義プロパティ

<table class="md-table md-table-3cols">
 <thead>
  <tr>
   <th style="text-align: left;">
    プロパティ名
   </th>
   <th style="text-align: left;">
    説明
   </th>
   <th style="text-align: left;">
    用途
   </th>
  </tr>
 </thead>
 <tbody>
  <tr>
   <td style="text-align: left;">
    testId
   </td>
   <td style="text-align: left;">
   </td>
   <td style="text-align: left;">
   </td>
  </tr>
  <tr>
   <td style="text-align: left;">
    status
   </td>
   <td style="text-align: left;">
   </td>
   <td style="text-align: left;">
   </td>
  </tr>
  <tr>
   <td style="text-align: left;">
    name
   </td>
   <td style="text-align: left;">
   </td>
   <td style="text-align: left;">
   </td>
  </tr>
  <tr>
   <td style="text-align: left;">
    resultId
   </td>
   <td style="text-align: left;">
   </td>
   <td style="text-align: left;">
   </td>
  </tr>
  <tr>
   <td style="text-align: left;">
    istestContainer
   </td>
   <td style="text-align: left;">
   </td>
   <td style="text-align: left;">
   </td>
  </tr>
  <tr>
   <td style="text-align: left;">
    testStatus
   </td>
   <td style="text-align: left;">
   </td>
   <td style="text-align: left;">
   </td>
  </tr>
  <tr>
   <td style="text-align: left;">
    testCreatorName
   </td>
   <td style="text-align: left;">
   </td>
   <td style="text-align: left;">
   </td>
  </tr>
  <tr>
   <td style="text-align: left;">
    testCreatorEmail
   </td>
   <td style="text-align: left;">
   </td>
   <td style="text-align: left;">
   </td>
  </tr>
  <tr>
   <td style="text-align: left;">
    testOwnerName
   </td>
   <td style="text-align: left;">
   </td>
   <td style="text-align: left;">
   </td>
  </tr>
  <tr>
   <td style="text-align: left;">
    testOwnerEmail
   </td>
   <td style="text-align: left;">
   </td>
   <td style="text-align: left;">
   </td>
  </tr>
  <tr>
   <td style="text-align: left;">
    testLables
   </td>
   <td style="text-align: left;">
   </td>
   <td style="text-align: left;">
   </td>
  </tr>
  <tr>
   <td style="text-align: left;">
    testSuites
   </td>
   <td style="text-align: left;">
   </td>
   <td style="text-align: left;">
   </td>
  </tr>
  <tr>
   <td style="text-align: left;">
    config
   </td>
   <td style="text-align: left;">
   </td>
   <td style="text-align: left;">
   </td>
  </tr>
  <tr>
   <td style="text-align: left;">
    workerId
   </td>
   <td style="text-align: left;">
   </td>
   <td style="text-align: left;">
   </td>
  </tr>
  <tr>
   <td style="text-align: left;">
    startTime
   </td>
   <td style="text-align: left;">
   </td>
   <td style="text-align: left;">
   </td>
  </tr>
  <tr>
   <td style="text-align: left;">
    sessionId
   </td>
   <td style="text-align: left;">
   </td>
   <td style="text-align: left;">
   </td>
  </tr>
  <tr>
   <td style="text-align: left;">
    duration
   </td>
   <td style="text-align: left;">
   </td>
   <td style="text-align: left;">
   </td>
  </tr>
  <tr>
   <td style="text-align: left;">
    failureReason
   </td>
   <td style="text-align: left;">
   </td>
   <td style="text-align: left;">
   </td>
  </tr>
  <tr>
   <td style="text-align: left;">
    failurePath
   </td>
   <td style="text-align: left;">
   </td>
   <td style="text-align: left;">
   </td>
  </tr>
  <tr>
   <td style="text-align: left;">
    success
   </td>
   <td style="text-align: left;">
   </td>
   <td style="text-align: left;">
   </td>
  </tr>
  <tr>
   <td style="text-align: left;">
    resultUrl
   </td>
   <td style="text-align: left;">
   </td>
   <td style="text-align: left;">
   </td>
  </tr>
  <tr>
   <td style="text-align: left;">
    total
   </td>
   <td style="text-align: left;">
   </td>
   <td style="text-align: left;">
   </td>
  </tr>
  <tr>
   <td style="text-align: left;">
    passed
   </td>
   <td style="text-align: left;">
   </td>
   <td style="text-align: left;">
   </td>
  </tr>
  <tr>
   <td style="text-align: left;">
    skipped
   </td>
   <td style="text-align: left;">
   </td>
   <td style="text-align: left;">
   </td>
  </tr>
 </tbody>
</table>

## Before Test の事前定義プロパティ

<table class="md-table md-table-3cols">
 <thead>
  <tr>
   <th style="text-align: left;">
    プロパティ名
   </th>
   <th style="text-align: left;">
    説明
   </th>
   <th style="text-align: left;">
    用途
   </th>
  </tr>
 </thead>
 <tbody>
  <tr>
   <td style="text-align: left;">
    testId
   </td>
   <td style="text-align: left;">
   </td>
   <td style="text-align: left;">
   </td>
  </tr>
  <tr>
   <td style="text-align: left;">
    isTestsContainer
   </td>
   <td style="text-align: left;">
   </td>
   <td style="text-align: left;">
   </td>
  </tr>
  <tr>
   <td style="text-align: left;">
    parallel
   </td>
   <td style="text-align: left;">
   </td>
   <td style="text-align: left;">
   </td>
  </tr>
  <tr>
   <td style="text-align: left;">
    browser
   </td>
   <td style="text-align: left;">
   </td>
   <td style="text-align: left;">
   </td>
  </tr>
  <tr>
   <td style="text-align: left;">
    gitBranch
   </td>
   <td style="text-align: left;">
   </td>
   <td style="text-align: left;">
   </td>
  </tr>
  <tr>
   <td style="text-align: left;">
    gitCommit
   </td>
   <td style="text-align: left;">
   </td>
   <td style="text-align: left;">
   </td>
  </tr>
  <tr>
   <td style="text-align: left;">
    gitRepoUrl
   </td>
   <td style="text-align: left;">
   </td>
   <td style="text-align: left;">
   </td>
  </tr>
  <tr>
   <td style="text-align: left;">
    runnerVersion
   </td>
   <td style="text-align: left;">
   </td>
   <td style="text-align: left;">
   </td>
  </tr>
  <tr>
   <td style="text-align: left;">
    gridHost
   </td>
   <td style="text-align: left;">
   </td>
   <td style="text-align: left;">
   </td>
  </tr>
  <tr>
   <td style="text-align: left;">
    testimBranch
   </td>
   <td style="text-align: left;">
   </td>
   <td style="text-align: left;">
   </td>
  </tr>
  <tr>
   <td style="text-align: left;">
    canaryMode
   </td>
   <td style="text-align: left;">
   </td>
   <td style="text-align: left;">
   </td>
  </tr>
  <tr>
   <td style="text-align: left;">
    source
   </td>
   <td style="text-align: left;">
   </td>
   <td style="text-align: left;">
   </td>
  </tr>
  <tr>
   <td style="text-align: left;">
    testPlans
   </td>
   <td style="text-align: left;">
   </td>
   <td style="text-align: left;">
   </td>
  </tr>
  <tr>
   <td style="text-align: left;">
    testLabels
   </td>
   <td style="text-align: left;">
   </td>
   <td style="text-align: left;">
   </td>
  </tr>
  <tr>
   <td style="text-align: left;">
    testNames
   </td>
   <td style="text-align: left;">
   </td>
   <td style="text-align: left;">
   </td>
  </tr>
  <tr>
   <td style="text-align: left;">
    testIds
   </td>
   <td style="text-align: left;">
   </td>
   <td style="text-align: left;">
   </td>
  </tr>
  <tr>
   <td style="text-align: left;">
    testConfigs
   </td>
   <td style="text-align: left;">
   </td>
   <td style="text-align: left;">
   </td>
  </tr>
  <tr>
   <td style="text-align: left;">
    testConfigIds
   </td>
   <td style="text-align: left;">
   </td>
   <td style="text-align: left;">
   </td>
  </tr>
  <tr>
   <td style="text-align: left;">
    port
   </td>
   <td style="text-align: left;">
   </td>
   <td style="text-align: left;">
   </td>
  </tr>
  <tr>
   <td style="text-align: left;">
    browserTimeout
   </td>
   <td style="text-align: left;">
   </td>
   <td style="text-align: left;">
   </td>
  </tr>
  <tr>
   <td style="text-align: left;">
    timeout
   </td>
   <td style="text-align: left;">
   </td>
   <td style="text-align: left;">
   </td>
  </tr>
  <tr>
   <td style="text-align: left;">
    newBrowserWaitTimeout
   </td>
   <td style="text-align: left;">
   </td>
   <td style="text-align: left;">
   </td>
  </tr>
  <tr>
   <td style="text-align: left;">
    tunnel
   </td>
   <td style="text-align: left;">
   </td>
   <td style="text-align: left;">
   </td>
  </tr>
  <tr>
   <td style="text-align: left;">
    tunnelPort
   </td>
   <td style="text-align: left;">
   </td>
   <td style="text-align: left;">
   </td>
  </tr>
  <tr>
   <td style="text-align: left;">
    tunnelHostHeader
   </td>
   <td style="text-align: left;">
   </td>
   <td style="text-align: left;">
   </td>
  </tr>
  <tr>
   <td style="text-align: left;">
    runnerMode
   </td>
   <td style="text-align: left;">
   </td>
   <td style="text-align: left;">
   </td>
  </tr>
  <tr>
   <td style="text-align: left;">
    gridId
   </td>
   <td style="text-align: left;">
   </td>
   <td style="text-align: left;">
   </td>
  </tr>
  <tr>
   <td style="text-align: left;">
    gridName
   </td>
   <td style="text-align: left;">
   </td>
   <td style="text-align: left;">
   </td>
  </tr>
  <tr>
   <td style="text-align: left;">
    retentionDays
   </td>
   <td style="text-align: left;">
   </td>
   <td style="text-align: left;">
   </td>
  </tr>
  <tr>
   <td style="text-align: left;">
    sessionType
   </td>
   <td style="text-align: left;">
   </td>
   <td style="text-align: left;">
   </td>
  </tr>
  <tr>
   <td style="text-align: left;">
    companyId
   </td>
   <td style="text-align: left;">
   </td>
   <td style="text-align: left;">
   </td>
  </tr>
  <tr>
   <td style="text-align: left;">
    testData
   </td>
   <td style="text-align: left;">
   </td>
   <td style="text-align: left;">
   </td>
  </tr>
  <tr>
   <td style="text-align: left;">
    isBeforeTestPlan
   </td>
   <td style="text-align: left;">
   </td>
   <td style="text-align: left;">
   </td>
  </tr>
  <tr>
   <td style="text-align: left;">
    isAfterTestPlan
   </td>
   <td style="text-align: left;">
   </td>
   <td style="text-align: left;">
   </td>
  </tr>
  <tr>
   <td style="text-align: left;">
    testDataTotal
   </td>
   <td style="text-align: left;">
   </td>
   <td style="text-align: left;">
   </td>
  </tr>
  <tr>
   <td style="text-align: left;">
    testDataIndex
   </td>
   <td style="text-align: left;">
   </td>
   <td style="text-align: left;">
   </td>
  </tr>
  <tr>
   <td style="text-align: left;">
    baseUrl
   </td>
   <td style="text-align: left;">
   </td>
   <td style="text-align: left;">
   </td>
  </tr>
  <tr>
   <td style="text-align: left;">
    testConfig
   </td>
   <td style="text-align: left;">
   </td>
   <td style="text-align: left;">
   </td>
  </tr>
  <tr>
   <td style="text-align: left;">
    resolution
   </td>
   <td style="text-align: left;">
   </td>
   <td style="text-align: left;">
   </td>
  </tr>
  <tr>
   <td style="text-align: left;">
    id
   </td>
   <td style="text-align: left;">
   </td>
   <td style="text-align: left;">
   </td>
  </tr>
  <tr>
   <td style="text-align: left;">
    name
   </td>
   <td style="text-align: left;">
   </td>
   <td style="text-align: left;">
   </td>
  </tr>
  <tr>
   <td style="text-align: left;">
    browser
   </td>
   <td style="text-align: left;">
   </td>
   <td style="text-align: left;">
   </td>
  </tr>
  <tr>
   <td style="text-align: left;">
    os
   </td>
   <td style="text-align: left;">
   </td>
   <td style="text-align: left;">
   </td>
  </tr>
  <tr>
   <td style="text-align: left;">
    isMobileWeb
   </td>
   <td style="text-align: left;">
   </td>
   <td style="text-align: left;">
   </td>
  </tr>
  <tr>
   <td style="text-align: left;">
    isMobile
   </td>
   <td style="text-align: left;">
   </td>
   <td style="text-align: left;">
   </td>
  </tr>
  <tr>
   <td style="text-align: left;">
    workerId
   </td>
   <td style="text-align: left;">
   </td>
   <td style="text-align: left;">
   </td>
  </tr>
  <tr>
   <td style="text-align: left;">
    exportsGlobal
   </td>
   <td style="text-align: left;">
   </td>
   <td style="text-align: left;">
   </td>
  </tr>
 </tbody>
</table>

## After Test の事前定義プロパティ

<table class="md-table md-table-3cols">
 <thead>
  <tr>
   <th style="text-align: left;">
    プロパティ名
   </th>
   <th style="text-align: left;">
    説明
   </th>
   <th style="text-align: left;">
    用途
   </th>
  </tr>
 </thead>
 <tbody>
  <tr>
   <td style="text-align: left;">
    testId
   </td>
   <td style="text-align: left;">
   </td>
   <td style="text-align: left;">
   </td>
  </tr>
  <tr>
   <td style="text-align: left;">
    status
   </td>
   <td style="text-align: left;">
   </td>
   <td style="text-align: left;">
   </td>
  </tr>
  <tr>
   <td style="text-align: left;">
    name
   </td>
   <td style="text-align: left;">
   </td>
   <td style="text-align: left;">
   </td>
  </tr>
  <tr>
   <td style="text-align: left;">
    resultId
   </td>
   <td style="text-align: left;">
   </td>
   <td style="text-align: left;">
   </td>
  </tr>
  <tr>
   <td style="text-align: left;">
    isTestsContainer
   </td>
   <td style="text-align: left;">
   </td>
   <td style="text-align: left;">
   </td>
  </tr>
  <tr>
   <td style="text-align: left;">
    config
   </td>
   <td style="text-align: left;">
   </td>
   <td style="text-align: left;">
   </td>
  </tr>
  <tr>
   <td style="text-align: left;">
    parallel
   </td>
   <td style="text-align: left;">
   </td>
   <td style="text-align: left;">
   </td>
  </tr>
  <tr>
   <td style="text-align: left;">
    browser
   </td>
   <td style="text-align: left;">
   </td>
   <td style="text-align: left;">
   </td>
  </tr>
  <tr>
   <td style="text-align: left;">
    gitBranch
   </td>
   <td style="text-align: left;">
   </td>
   <td style="text-align: left;">
   </td>
  </tr>
  <tr>
   <td style="text-align: left;">
    gitCommit
   </td>
   <td style="text-align: left;">
   </td>
   <td style="text-align: left;">
   </td>
  </tr>
  <tr>
   <td style="text-align: left;">
    gitRepoUrl
   </td>
   <td style="text-align: left;">
   </td>
   <td style="text-align: left;">
   </td>
  </tr>
  <tr>
   <td style="text-align: left;">
    runnerVersion
   </td>
   <td style="text-align: left;">
   </td>
   <td style="text-align: left;">
   </td>
  </tr>
  <tr>
   <td style="text-align: left;">
    gridHost
   </td>
   <td style="text-align: left;">
   </td>
   <td style="text-align: left;">
   </td>
  </tr>
  <tr>
   <td style="text-align: left;">
    testimBranch
   </td>
   <td style="text-align: left;">
   </td>
   <td style="text-align: left;">
   </td>
  </tr>
  <tr>
   <td style="text-align: left;">
    canaryMode
   </td>
   <td style="text-align: left;">
   </td>
   <td style="text-align: left;">
   </td>
  </tr>
  <tr>
   <td style="text-align: left;">
    source
   </td>
   <td style="text-align: left;">
   </td>
   <td style="text-align: left;">
   </td>
  </tr>
  <tr>
   <td style="text-align: left;">
    testPlans
   </td>
   <td style="text-align: left;">
   </td>
   <td style="text-align: left;">
   </td>
  </tr>
  <tr>
   <td style="text-align: left;">
    testLabels
   </td>
   <td style="text-align: left;">
   </td>
   <td style="text-align: left;">
   </td>
  </tr>
  <tr>
   <td style="text-align: left;">
    testNames
   </td>
   <td style="text-align: left;">
   </td>
   <td style="text-align: left;">
   </td>
  </tr>
  <tr>
   <td style="text-align: left;">
    testIds
   </td>
   <td style="text-align: left;">
   </td>
   <td style="text-align: left;">
   </td>
  </tr>
  <tr>
   <td style="text-align: left;">
    testConfigs
   </td>
   <td style="text-align: left;">
   </td>
   <td style="text-align: left;">
   </td>
  </tr>
  <tr>
   <td style="text-align: left;">
    testConfigIds
   </td>
   <td style="text-align: left;">
   </td>
   <td style="text-align: left;">
   </td>
  </tr>
  <tr>
   <td style="text-align: left;">
    port
   </td>
   <td style="text-align: left;">
   </td>
   <td style="text-align: left;">
   </td>
  </tr>
  <tr>
   <td style="text-align: left;">
    browserTimeout
   </td>
   <td style="text-align: left;">
   </td>
   <td style="text-align: left;">
   </td>
  </tr>
  <tr>
   <td style="text-align: left;">
    timeout
   </td>
   <td style="text-align: left;">
   </td>
   <td style="text-align: left;">
   </td>
  </tr>
  <tr>
   <td style="text-align: left;">
    newBrowserWaitTimeout
   </td>
   <td style="text-align: left;">
   </td>
   <td style="text-align: left;">
   </td>
  </tr>
  <tr>
   <td style="text-align: left;">
    tunnel
   </td>
   <td style="text-align: left;">
   </td>
   <td style="text-align: left;">
   </td>
  </tr>
  <tr>
   <td style="text-align: left;">
    tunnelPort
   </td>
   <td style="text-align: left;">
   </td>
   <td style="text-align: left;">
   </td>
  </tr>
  <tr>
   <td style="text-align: left;">
    tunnelHostHeader
   </td>
   <td style="text-align: left;">
   </td>
   <td style="text-align: left;">
   </td>
  </tr>
  <tr>
   <td style="text-align: left;">
    runnerMode
   </td>
   <td style="text-align: left;">
   </td>
   <td style="text-align: left;">
   </td>
  </tr>
  <tr>
   <td style="text-align: left;">
    gridId
   </td>
   <td style="text-align: left;">
   </td>
   <td style="text-align: left;">
   </td>
  </tr>
  <tr>
   <td style="text-align: left;">
    gridName
   </td>
   <td style="text-align: left;">
   </td>
   <td style="text-align: left;">
   </td>
  </tr>
  <tr>
   <td style="text-align: left;">
    retentionDays
   </td>
   <td style="text-align: left;">
   </td>
   <td style="text-align: left;">
   </td>
  </tr>
  <tr>
   <td style="text-align: left;">
    sessionType
   </td>
   <td style="text-align: left;">
   </td>
   <td style="text-align: left;">
   </td>
  </tr>
  <tr>
   <td style="text-align: left;">
    companyId
   </td>
   <td style="text-align: left;">
   </td>
   <td style="text-align: left;">
   </td>
  </tr>
  <tr>
   <td style="text-align: left;">
    testData
   </td>
   <td style="text-align: left;">
   </td>
   <td style="text-align: left;">
   </td>
  </tr>
  <tr>
   <td style="text-align: left;">
    isBeforeTestPlan
   </td>
   <td style="text-align: left;">
   </td>
   <td style="text-align: left;">
   </td>
  </tr>
  <tr>
   <td style="text-align: left;">
    isAfterTestPlan
   </td>
   <td style="text-align: left;">
   </td>
   <td style="text-align: left;">
   </td>
  </tr>
  <tr>
   <td style="text-align: left;">
    testDataTotal
   </td>
   <td style="text-align: left;">
   </td>
   <td style="text-align: left;">
   </td>
  </tr>
  <tr>
   <td style="text-align: left;">
    testDataIndex
   </td>
   <td style="text-align: left;">
   </td>
   <td style="text-align: left;">
   </td>
  </tr>
  <tr>
   <td style="text-align: left;">
    baseUrl
   </td>
   <td style="text-align: left;">
   </td>
   <td style="text-align: left;">
   </td>
  </tr>
  <tr>
   <td style="text-align: left;">
    testConfig
   </td>
   <td style="text-align: left;">
   </td>
   <td style="text-align: left;">
   </td>
  </tr>
  <tr>
   <td style="text-align: left;">
    resolution
   </td>
   <td style="text-align: left;">
   </td>
   <td style="text-align: left;">
   </td>
  </tr>
  <tr>
   <td style="text-align: left;">
    id
   </td>
   <td style="text-align: left;">
   </td>
   <td style="text-align: left;">
   </td>
  </tr>
  <tr>
   <td style="text-align: left;">
    name
   </td>
   <td style="text-align: left;">
   </td>
   <td style="text-align: left;">
   </td>
  </tr>
  <tr>
   <td style="text-align: left;">
    browser
   </td>
   <td style="text-align: left;">
   </td>
   <td style="text-align: left;">
   </td>
  </tr>
  <tr>
   <td style="text-align: left;">
    os
   </td>
   <td style="text-align: left;">
   </td>
   <td style="text-align: left;">
   </td>
  </tr>
  <tr>
   <td style="text-align: left;">
    isMobileWeb
   </td>
   <td style="text-align: left;">
   </td>
   <td style="text-align: left;">
   </td>
  </tr>
  <tr>
   <td style="text-align: left;">
    isMobile
   </td>
   <td style="text-align: left;">
   </td>
   <td style="text-align: left;">
   </td>
  </tr>
  <tr>
   <td style="text-align: left;">
    gridInfo
   </td>
   <td style="text-align: left;">
   </td>
   <td style="text-align: left;">
   </td>
  </tr>
  <tr>
   <td style="text-align: left;">
    host
   </td>
   <td style="text-align: left;">
   </td>
   <td style="text-align: left;">
   </td>
  </tr>
  <tr>
   <td style="text-align: left;">
    port
   </td>
   <td style="text-align: left;">
   </td>
   <td style="text-align: left;">
   </td>
  </tr>
  <tr>
   <td style="text-align: left;">
    protocol
   </td>
   <td style="text-align: left;">
   </td>
   <td style="text-align: left;">
   </td>
  </tr>
  <tr>
   <td style="text-align: left;">
    accessToken
   </td>
   <td style="text-align: left;">
   </td>
   <td style="text-align: left;">
   </td>
  </tr>
  <tr>
   <td style="text-align: left;">
    slotId
   </td>
   <td style="text-align: left;">
   </td>
   <td style="text-align: left;">
   </td>
  </tr>
  <tr>
   <td style="text-align: left;">
    gridId
   </td>
   <td style="text-align: left;">
   </td>
   <td style="text-align: left;">
   </td>
  </tr>
  <tr>
   <td style="text-align: left;">
    user
   </td>
   <td style="text-align: left;">
   </td>
   <td style="text-align: left;">
   </td>
  </tr>
  <tr>
   <td style="text-align: left;">
    key
   </td>
   <td style="text-align: left;">
   </td>
   <td style="text-align: left;">
   </td>
  </tr>
  <tr>
   <td style="text-align: left;">
    type
   </td>
   <td style="text-align: left;">
   </td>
   <td style="text-align: left;">
   </td>
  </tr>
  <tr>
   <td style="text-align: left;">
    name
   </td>
   <td style="text-align: left;">
   </td>
   <td style="text-align: left;">
   </td>
  </tr>
  <tr>
   <td style="text-align: left;">
    arn
   </td>
   <td style="text-align: left;">
   </td>
   <td style="text-align: left;">
   </td>
  </tr>
  <tr>
   <td style="text-align: left;">
    workerId
   </td>
   <td style="text-align: left;">
   </td>
   <td style="text-align: left;">
   </td>
  </tr>
  <tr>
   <td style="text-align: left;">
    startTime
   </td>
   <td style="text-align: left;">
   </td>
   <td style="text-align: left;">
   </td>
  </tr>
  <tr>
   <td style="text-align: left;">
    sessionId
   </td>
   <td style="text-align: left;">
   </td>
   <td style="text-align: left;">
   </td>
  </tr>
  <tr>
   <td style="text-align: left;">
    duration
   </td>
   <td style="text-align: left;">
   </td>
   <td style="text-align: left;">
   </td>
  </tr>
  <tr>
   <td style="text-align: left;">
    failureReason
   </td>
   <td style="text-align: left;">
   </td>
   <td style="text-align: left;">
   </td>
  </tr>
  <tr>
   <td style="text-align: left;">
    success
   </td>
   <td style="text-align: left;">
   </td>
   <td style="text-align: left;">
   </td>
  </tr>
  <tr>
   <td style="text-align: left;">
    globalParameters
   </td>
   <td style="text-align: left;">
   </td>
   <td style="text-align: left;">
   </td>
  </tr>
 </tbody>
</table>
