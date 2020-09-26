/*
 *  Copyright (c) 2017 The WebRTC project authors. All Rights Reserved.
 *
 *  Use of this source code is governed by a BSD-style license
 *  that can be found in the LICENSE file in the root of the source
 *  tree.
 */
/* eslint-env node */

'use strict';

const express = require('express');
const https = require('https');
const pem = require('pem');
const fs = require('fs');

pem.createCertificate({days: 1, selfSigned: true}, function(err, keys) {
  const options = {
    key: fs.readFileSync('../certs/server.pem'),
    cert: fs.readFileSync('../certs/server.pem')
  };

  const app = express();

  app.use(express.static('../'));

  // Create an HTTPS service.
  https.createServer(options, app).listen(8443);

  console.log('serving on https://localhost:8443');
});
